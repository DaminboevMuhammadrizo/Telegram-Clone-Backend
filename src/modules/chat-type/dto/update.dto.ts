import { PartialType } from "@nestjs/swagger";
import { CreateChatTypeDto } from "./create.dto";

export class UpdateChatTypeDto extends PartialType(CreateChatTypeDto) { }
