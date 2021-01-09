import { EntityRepository, Repository } from "typeorm"
import { Refund } from "../models/Refund"

@EntityRepository(Refund)
export class RefundRepository extends Repository<Refund> {}
