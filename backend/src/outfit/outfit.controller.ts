import {
Controller,
Get,
Post,
Patch,
Delete,
Param,
Body,
} from '@nestjs/common';

import { OutfitService } from './outfit.service';
import { Outfit } from './outfit.entity';

@Controller('outfit')
export class OutfitController {
constructor(private readonly outfitService: OutfitService) {}

@Get()
findAll() {
return this.outfitService.findAll();
}

@Get(':id')
findOne(@Param('id') id: string) {
return this.outfitService.findOne(Number(id));
}

@Post()
create(@Body() data: Partial<Outfit>) {
return this.outfitService.create(data);
}

@Patch(':id')
update(
@Param('id') id: string,
@Body() data: Partial<Outfit>,
) {
return this.outfitService.update(Number(id), data);
}

@Delete(':id')
remove(@Param('id') id: string) {
return this.outfitService.remove(Number(id));
}
}
