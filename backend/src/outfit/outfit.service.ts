import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Outfit } from './outfit.entity';

@Injectable()
export class OutfitService {
constructor(
@Inject('OUTFIT_REPOSITORY')
private readonly outfitRepository: Repository<Outfit>,
) {}

findAll() {
return this.outfitRepository.find();
}

findOne(id: number) {
return this.outfitRepository.findOne({
where: { outfit_id: id },
});
}

create(data: Partial<Outfit>) {
const outfit = this.outfitRepository.create(data);
return this.outfitRepository.save(outfit);
}

update(id: number, data: Partial<Outfit>) {
return this.outfitRepository.update(id, data);
}

remove(id: number) {
return this.outfitRepository.delete(id);
}
}
