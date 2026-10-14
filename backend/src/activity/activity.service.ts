import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Clothing } from '../clothing/clothing.entity';
import { Outfit } from '../outfit/outfit.entity';
import { OutfitItem } from '../outfit-item/outfit-item.entity';
import { OutfitPlan } from './outfit-plan.entity';
import { WearLog } from './wear-log.entity';
import { WearLogItem } from './wear-log-item.entity';

interface ClothingRow {
  clothing_id: number;
  name: string;
  color: string | null;
  season: string | null;
  clothing_type: string | null;
  category_name: string;
  wear_count: number;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Request body must be an object');
  }
  return value as Record<string, unknown>;
}

function validDate(value: unknown, field: string): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${field} must use YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return true;
}

function optionalText(value: unknown, field: string, maximum: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > maximum) {
    throw new BadRequestException(`${field} must be text up to ${maximum} characters`);
  }
  return value.trim() || null;
}

@Injectable()
export class ActivityService {
  constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {}

  async getLogs(user_id: number) {
    return this.dataSource.query(
      `SELECT logs.wear_log_id, logs.worn_on, logs.note, logs.outfit_id,
              outfits.name AS outfit_name,
              COALESCE(items.clothing_names, '') AS clothing_names,
              COALESCE(items.clothing_ids, '') AS clothing_ids
       FROM wear_logs logs
       LEFT JOIN outfits ON outfits.outfit_id = logs.outfit_id
         AND outfits.user_id = logs.user_id
       LEFT JOIN (
         SELECT links.wear_log_id,
                GROUP_CONCAT(clothing.name ORDER BY clothing.name SEPARATOR ', ') AS clothing_names,
                GROUP_CONCAT(clothing.clothing_id ORDER BY clothing.clothing_id SEPARATOR ',') AS clothing_ids
         FROM wear_log_items links
         INNER JOIN clothing ON clothing.clothing_id = links.clothing_id
         GROUP BY links.wear_log_id
       ) items ON items.wear_log_id = logs.wear_log_id
       WHERE logs.user_id = ?
       ORDER BY logs.worn_on DESC, logs.wear_log_id DESC
       LIMIT 100`,
      [user_id],
    );
  }

  async createLog(value: unknown, user_id: number) {
    const input = record(value);
    validDate(input.worn_on, 'worn_on');
    const requestedClothingIds = input.clothing_ids ?? [];
    if (!Array.isArray(requestedClothingIds) || requestedClothingIds.length > 30) {
      throw new BadRequestException('Select no more than 30 clothing items');
    }
    let clothing_ids = [...new Set(requestedClothingIds)];
    if (clothing_ids.length !== requestedClothingIds.length ||
      clothing_ids.some((id) => !Number.isSafeInteger(id) || Number(id) < 1)) {
      throw new BadRequestException('clothing_ids must contain unique positive integers');
    }
    const outfit_id = input.outfit_id == null || input.outfit_id === ''
      ? null
      : Number(input.outfit_id);
    if (outfit_id !== null && (!Number.isSafeInteger(outfit_id) || outfit_id < 1)) {
      throw new BadRequestException('outfit_id must be a positive integer');
    }
    const note = optionalText(input.note, 'note', 1000);

    if (outfit_id !== null && !(await this.dataSource.getRepository(Outfit).findOne({ where: { outfit_id, user_id } }))) {
      throw new NotFoundException('Outfit not found');
    }
    if (!clothing_ids.length && outfit_id !== null) {
      const outfitItems = await this.dataSource.getRepository(OutfitItem).find({
        where: { outfit_id },
      });
      if (outfitItems.length > 30) {
        throw new BadRequestException(
          'The saved outfit has more than 30 pieces and cannot be logged at once',
        );
      }
      clothing_ids = outfitItems.map((item) => item.clothing_id);
    }
    if (!clothing_ids.length) {
      throw new BadRequestException('Select clothing items or a saved outfit');
    }
    const clothingCount = await this.dataSource.getRepository(Clothing).count({
      where: clothing_ids.map((clothing_id) => ({ clothing_id, user_id })),
    });
    if (clothingCount !== clothing_ids.length) {
      throw new NotFoundException('One or more clothing items were not found');
    }

    const wear_log_id = await this.dataSource.transaction(async (manager) => {
      const log = await manager.getRepository(WearLog).save(
        manager.getRepository(WearLog).create({
          user_id,
          worn_on: input.worn_on as string,
          note,
          outfit_id,
        }),
      );
      await manager.getRepository(WearLogItem).save(
        clothing_ids.map((clothing_id) =>
          manager.getRepository(WearLogItem).create({ wear_log_id: log.wear_log_id, clothing_id }),
        ),
      );
      return log.wear_log_id;
    });
    const [log] = await this.dataSource.query(
      `SELECT logs.wear_log_id, logs.worn_on, logs.note, logs.outfit_id,
              outfits.name AS outfit_name,
              COALESCE(items.clothing_names, '') AS clothing_names,
              COALESCE(items.clothing_ids, '') AS clothing_ids
       FROM wear_logs logs
       LEFT JOIN outfits ON outfits.outfit_id = logs.outfit_id
         AND outfits.user_id = logs.user_id
       LEFT JOIN (
         SELECT links.wear_log_id,
                GROUP_CONCAT(clothing.name ORDER BY clothing.name SEPARATOR ', ') AS clothing_names,
                GROUP_CONCAT(clothing.clothing_id ORDER BY clothing.clothing_id SEPARATOR ',') AS clothing_ids
         FROM wear_log_items links
         INNER JOIN clothing ON clothing.clothing_id = links.clothing_id
         GROUP BY links.wear_log_id
       ) items ON items.wear_log_id = logs.wear_log_id
       WHERE logs.user_id = ? AND logs.wear_log_id = ?`,
      [user_id, wear_log_id],
    );
    return log;
  }

  async removeLog(wear_log_id: number, user_id: number): Promise<void> {
    if (!Number.isSafeInteger(wear_log_id) || wear_log_id < 1) {
      throw new BadRequestException('Invalid wear log ID');
    }
    const result = await this.dataSource.getRepository(WearLog).delete({ wear_log_id, user_id });
    if (!result.affected) throw new NotFoundException('Wear log not found');
  }

  async updateLog(wear_log_id: number, value: unknown, user_id: number) {
    if (!Number.isSafeInteger(wear_log_id) || wear_log_id < 1) {
      throw new BadRequestException('Invalid wear log ID');
    }
    const input = record(value);
    const repository = this.dataSource.getRepository(WearLog);
    const existing = await repository.findOne({ where: { wear_log_id, user_id } });
    if (!existing) throw new NotFoundException('Wear log not found');
    if (!Object.keys(input).some((key) => ['worn_on', 'note', 'outfit_id', 'clothing_ids'].includes(key))) {
      throw new BadRequestException('At least one wear log field is required');
    }

    if (input.worn_on !== undefined) validDate(input.worn_on, 'worn_on');
    const note = input.note === undefined ? existing.note : optionalText(input.note, 'note', 1000);
    let outfit_id = existing.outfit_id;
    if (input.outfit_id !== undefined) {
      outfit_id = input.outfit_id == null || input.outfit_id === '' ? null : Number(input.outfit_id);
      if (outfit_id !== null) {
        if (!Number.isSafeInteger(outfit_id) || outfit_id < 1) {
          throw new BadRequestException('outfit_id must be a positive integer');
        }
        if (!(await this.dataSource.getRepository(Outfit).findOne({ where: { outfit_id, user_id } }))) {
          throw new NotFoundException('Outfit not found');
        }
      }
    }

    let clothing_ids: number[] | undefined;
    if (input.clothing_ids !== undefined) {
      if (!Array.isArray(input.clothing_ids) || input.clothing_ids.length > 30 ||
        input.clothing_ids.some((id) => !Number.isSafeInteger(id) || Number(id) < 1) ||
        new Set(input.clothing_ids).size !== input.clothing_ids.length) {
        throw new BadRequestException('clothing_ids must contain up to 30 unique positive integers');
      }
      clothing_ids = input.clothing_ids as number[];
      const count = await this.dataSource.getRepository(Clothing).count({
        where: clothing_ids.map((clothing_id) => ({ clothing_id, user_id })),
      });
      if (count !== clothing_ids.length) {
        throw new NotFoundException('One or more clothing items were not found');
      }
      if (!clothing_ids.length && outfit_id !== null) {
        const outfitItems = await this.dataSource.getRepository(OutfitItem).find({
          where: { outfit_id },
        });
        if (outfitItems.length > 30) {
          throw new BadRequestException(
            'The saved outfit has more than 30 pieces and cannot be logged at once',
          );
        }
        clothing_ids = outfitItems.map((item) => item.clothing_id);
      }
    }

    const linksRepository = this.dataSource.getRepository(WearLogItem);
    const currentLinks = await linksRepository.find({ where: { wear_log_id } });
    if (!(clothing_ids ?? currentLinks.map((link) => link.clothing_id)).length && outfit_id === null) {
      throw new BadRequestException('Select clothing items or a saved outfit');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(WearLog).update(
        { wear_log_id, user_id },
        {
          ...(input.worn_on !== undefined ? { worn_on: input.worn_on as string } : {}),
          note,
          outfit_id,
        },
      );
      if (clothing_ids !== undefined) {
        await manager.getRepository(WearLogItem).delete({ wear_log_id });
        if (clothing_ids.length) {
          await manager.getRepository(WearLogItem).save(
            clothing_ids.map((clothing_id) =>
              manager.getRepository(WearLogItem).create({ wear_log_id, clothing_id }),
            ),
          );
        }
      }
    });
    return { wear_log_id, worn_on: input.worn_on ?? existing.worn_on, note, outfit_id };
  }

  async getPlans(user_id: number, from?: string, to?: string) {
    if (!from || !to) {
      throw new BadRequestException('Both from and to are required for date filtering');
    }
    validDate(from, 'from');
    validDate(to, 'to');
    const range = Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`);
    if (range < 0 || range > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Date range must be ordered and no longer than 366 days');
    }
    return this.dataSource.query(
      `SELECT plans.outfit_plan_id, plans.outfit_id, plans.planned_for,
              plans.occasion, plans.note, outfits.name AS outfit_name
       FROM outfit_plans plans
       INNER JOIN outfits ON outfits.outfit_id = plans.outfit_id
         AND outfits.user_id = plans.user_id
       WHERE plans.user_id = ? AND plans.planned_for >= ? AND plans.planned_for <= ?
       ORDER BY plans.planned_for ASC, plans.outfit_plan_id ASC`,
      [user_id, from, to],
    );
  }

  async createPlan(value: unknown, user_id: number) {
    const input = record(value);
    const outfit_id = Number(input.outfit_id);
    if (!Number.isSafeInteger(outfit_id) || outfit_id < 1) {
      throw new BadRequestException('outfit_id must be a positive integer');
    }
    validDate(input.planned_for, 'planned_for');
    const occasion = optionalText(input.occasion, 'occasion', 100);
    const note = optionalText(input.note, 'note', 1000);
    const outfit = await this.dataSource.getRepository(Outfit).findOne({
      where: { outfit_id, user_id },
    });
    if (!outfit) throw new NotFoundException('Outfit not found');
    const plan = await this.dataSource.getRepository(OutfitPlan).save(
      this.dataSource.getRepository(OutfitPlan).create({
        user_id,
        outfit_id,
        planned_for: input.planned_for as string,
        occasion,
        note,
      }),
    );
    return {
      outfit_plan_id: plan.outfit_plan_id,
      user_id: plan.user_id,
      outfit_id: plan.outfit_id,
      planned_for: plan.planned_for,
      occasion: plan.occasion,
      note: plan.note,
      outfit_name: outfit.name,
    };
  }

  async removePlan(outfit_plan_id: number, user_id: number): Promise<void> {
    if (!Number.isSafeInteger(outfit_plan_id) || outfit_plan_id < 1) {
      throw new BadRequestException('Invalid outfit plan ID');
    }
    const result = await this.dataSource.getRepository(OutfitPlan).delete({
      outfit_plan_id,
      user_id,
    });
    if (!result.affected) throw new NotFoundException('Outfit plan not found');
  }

  async updatePlan(outfit_plan_id: number, value: unknown, user_id: number) {
    if (!Number.isSafeInteger(outfit_plan_id) || outfit_plan_id < 1) {
      throw new BadRequestException('Invalid outfit plan ID');
    }
    const input = record(value);
    const repository = this.dataSource.getRepository(OutfitPlan);
    const existing = await repository.findOne({ where: { outfit_plan_id, user_id } });
    if (!existing) throw new NotFoundException('Outfit plan not found');
    if (!Object.keys(input).some((key) => ['outfit_id', 'planned_for', 'occasion', 'note'].includes(key))) {
      throw new BadRequestException('At least one plan field is required');
    }

    const outfit_id = input.outfit_id === undefined ? existing.outfit_id : Number(input.outfit_id);
    if (!Number.isSafeInteger(outfit_id) || outfit_id < 1) {
      throw new BadRequestException('outfit_id must be a positive integer');
    }
    const outfit = await this.dataSource.getRepository(Outfit).findOne({ where: { outfit_id, user_id } });
    if (!outfit) throw new NotFoundException('Outfit not found');
    if (input.planned_for !== undefined) validDate(input.planned_for, 'planned_for');
    const occasion = input.occasion === undefined ? existing.occasion : optionalText(input.occasion, 'occasion', 100);
    const note = input.note === undefined ? existing.note : optionalText(input.note, 'note', 1000);
    await repository.update({ outfit_plan_id, user_id }, {
      outfit_id,
      ...(input.planned_for !== undefined ? { planned_for: input.planned_for as string } : {}),
      occasion,
      note,
    });
    return {
      outfit_plan_id,
      outfit_id,
      planned_for: input.planned_for ?? existing.planned_for,
      occasion,
      note,
      outfit_name: outfit.name,
    };
  }

  async updateCare(clothing_id: number, value: unknown, user_id: number) {
    if (!Number.isSafeInteger(clothing_id) || clothing_id < 1) {
      throw new BadRequestException('Invalid clothing ID');
    }
    const input = record(value);
    const fields: Partial<Clothing> = {};
    if ('care_instructions' in input) {
      fields.care_instructions = optionalText(input.care_instructions, 'care_instructions', 2000);
    }
    if ('wash_after_wears' in input) {
      if (!Number.isSafeInteger(input.wash_after_wears) ||
        Number(input.wash_after_wears) < 1 || Number(input.wash_after_wears) > 30) {
        throw new BadRequestException('wash_after_wears must be between 1 and 30');
      }
      fields.wash_after_wears = Number(input.wash_after_wears);
    }
    if ('last_washed_at' in input) {
      if (input.last_washed_at === null) fields.last_washed_at = null;
      else validDate(input.last_washed_at, 'last_washed_at');
      fields.last_washed_at = input.last_washed_at as string | null;
    }
    if (!Object.keys(fields).length) {
      throw new BadRequestException('At least one care field is required');
    }
    const repository = this.dataSource.getRepository(Clothing);
    const result = await repository.update({ clothing_id, user_id }, fields);
    if (!result.affected) throw new NotFoundException('Clothing item not found');
    return repository.findOne({ where: { clothing_id, user_id } });
  }

  async getDashboard(user_id: number) {
    const [totals, categories, seasons, wearRanking, recent, upcoming, care] =
      await Promise.all([
        this.dataSource.query(
          `SELECT COUNT(*) AS total,
             SUM(NOT EXISTS (SELECT 1 FROM wear_log_items links
               INNER JOIN wear_logs logs ON logs.wear_log_id = links.wear_log_id
               WHERE links.clothing_id = clothing.clothing_id AND logs.user_id = ?)) AS unworn
           FROM clothing WHERE user_id = ?`,
          [user_id, user_id],
        ),
        this.dataSource.query(
          `SELECT categories.category_id, categories.name, COUNT(clothing.clothing_id) AS count
           FROM categories LEFT JOIN clothing ON clothing.category_id = categories.category_id
             AND clothing.user_id = ?
           GROUP BY categories.category_id, categories.name ORDER BY categories.name`,
          [user_id],
        ),
        this.dataSource.query(
          `SELECT COALESCE(season, 'unspecified') AS season, COUNT(*) AS count
           FROM clothing WHERE user_id = ? GROUP BY season ORDER BY season`,
          [user_id],
        ),
        this.dataSource.query(
          `SELECT clothing.clothing_id, clothing.name, COUNT(links.wear_log_item_id) AS wear_count
           FROM clothing LEFT JOIN wear_log_items links ON links.clothing_id = clothing.clothing_id
           LEFT JOIN wear_logs logs ON logs.wear_log_id = links.wear_log_id AND logs.user_id = ?
           WHERE clothing.user_id = ?
           GROUP BY clothing.clothing_id, clothing.name
           ORDER BY wear_count DESC, clothing.name ASC`,
          [user_id, user_id],
        ),
        this.dataSource.query(
          `SELECT logs.wear_log_id, logs.worn_on, logs.note, outfits.name AS outfit_name,
             COALESCE(items.clothing_names, '') AS clothing_names
           FROM wear_logs logs
           LEFT JOIN outfits ON outfits.outfit_id = logs.outfit_id AND outfits.user_id = logs.user_id
           LEFT JOIN (
             SELECT links.wear_log_id,
               GROUP_CONCAT(clothing.name ORDER BY clothing.name SEPARATOR ', ') AS clothing_names
             FROM wear_log_items links INNER JOIN clothing ON clothing.clothing_id = links.clothing_id
             GROUP BY links.wear_log_id
           ) items ON items.wear_log_id = logs.wear_log_id
           WHERE logs.user_id = ? ORDER BY logs.worn_on DESC, logs.wear_log_id DESC LIMIT 5`,
          [user_id],
        ),
        this.dataSource.query(
          `SELECT plans.outfit_plan_id, plans.planned_for, plans.occasion, outfits.name AS outfit_name
           FROM outfit_plans plans INNER JOIN outfits
             ON outfits.outfit_id = plans.outfit_id AND outfits.user_id = plans.user_id
           WHERE plans.user_id = ? AND plans.planned_for >= CURRENT_DATE
           ORDER BY plans.planned_for ASC LIMIT 5`,
          [user_id],
        ),
        this.dataSource.query(
          `SELECT clothing.clothing_id, clothing.name, clothing.wash_after_wears,
             COUNT(logs.wear_log_id) AS wears_since_wash
           FROM clothing
           INNER JOIN wear_log_items links ON links.clothing_id = clothing.clothing_id
           INNER JOIN wear_logs logs ON logs.wear_log_id = links.wear_log_id
             AND logs.user_id = clothing.user_id
             AND logs.worn_on > COALESCE(clothing.last_washed_at, '1000-01-01')
           WHERE clothing.user_id = ?
           GROUP BY clothing.clothing_id, clothing.name, clothing.wash_after_wears
           HAVING wears_since_wash >= clothing.wash_after_wears
           ORDER BY wears_since_wash DESC LIMIT 10`,
          [user_id],
        ),
      ]);
    const ranked = wearRanking as { clothing_id: number; name: string; wear_count: number }[];
    const used = ranked.filter((item) => Number(item.wear_count) > 0);
    const season = this.currentSeason();
    const total = Number((totals as { total: number; unworn: number }[])[0]?.total ?? 0);
    return {
      total_clothing: total,
      unworn_count: Number((totals as { total: number; unworn: number }[])[0]?.unworn ?? 0),
      unworn_percent: total ? Math.round((Number((totals as { unworn: number }[])[0]?.unworn ?? 0) / total) * 100) : 0,
      categories,
      seasons,
      most_worn: used[0] ?? null,
      least_worn: used.length ? used[used.length - 1] : null,
      recent_logs: recent,
      upcoming_plans: upcoming,
      care_due: care,
      current_season: season,
    };
  }

  async getRecommendations(user_id: number) {
    const season = this.currentSeason();
    const clothing = await this.dataSource.query<ClothingRow[]>(
      `SELECT clothing.clothing_id, clothing.name, clothing.color, clothing.season,
              clothing.clothing_type, categories.name AS category_name,
              COUNT(logs.wear_log_id) AS wear_count
       FROM clothing
       INNER JOIN categories ON categories.category_id = clothing.category_id
       LEFT JOIN wear_log_items links ON links.clothing_id = clothing.clothing_id
       LEFT JOIN wear_logs logs ON logs.wear_log_id = links.wear_log_id
         AND logs.user_id = clothing.user_id
       WHERE clothing.user_id = ?
       GROUP BY clothing.clothing_id, clothing.name, clothing.color, clothing.season,
                clothing.clothing_type, categories.name
       ORDER BY clothing.name LIMIT 300`,
      [user_id],
    );
    const suitable = clothing.filter((item) =>
      !item.season || item.season === 'all-season' || item.season === season,
    );
    const tops = suitable.filter((item) => item.clothing_type === 'top');
    const bottoms = suitable.filter((item) => item.clothing_type === 'bottom');
    const dresses = suitable.filter((item) =>
      item.clothing_type === 'dress' || /dress/i.test(item.category_name),
    );
    const candidates: {
      items: ClothingRow[];
      score: number;
      reason: string;
    }[] = [];
    for (const dress of dresses.slice(0, 100)) {
      candidates.push({
        items: [dress],
        score: Number(dress.wear_count) * 3 + (dress.season === season ? -1 : 0),
        reason: `A ${season}-ready one-piece outfit. It also favours pieces you wear less often.`,
      });
    }
    for (const top of tops.slice(0, 100)) {
      for (const bottom of bottoms.slice(0, 100)) {
        const colorsMatch = Boolean(top.color && bottom.color &&
          top.color.trim().toLowerCase() === bottom.color.trim().toLowerCase());
        candidates.push({
          items: [top, bottom],
          score: Number(top.wear_count) + Number(bottom.wear_count) - (colorsMatch ? 4 : 0),
          reason: `Pairs a ${season}-ready top and bottom; less-worn pieces rank first.`,
        });
      }
    }
    return {
      season,
      recommendations: candidates
        .sort((left, right) => left.score - right.score)
        .slice(0, 6)
        .map(({ items, reason }) => ({
          items: items.map(({ clothing_id, name, color, clothing_type }) => ({
            clothing_id, name, color, clothing_type,
          })),
          reason,
        })),
    };
  }

  private currentSeason(): string {
    const month = new Date().getUTCMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
}
