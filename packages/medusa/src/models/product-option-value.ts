import {
  Entity,
  Index,
  JoinColumn,
  BeforeInsert,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
  PrimaryColumn,
} from "typeorm"
import randomize from "randomatic"

import { ProductOption } from "./product-option"
import { ProductVariant } from "./product-variant"

@Index(["option_id", "value"], { unique: true })
@Entity()
export class ProductOptionValue {
  @PrimaryColumn()
  id: string

  @Column()
  value: string

  @Index()
  @Column()
  option_id: string

  @ManyToOne(
    () => ProductOption,
    option => option.values
  )
  @JoinColumn({ name: "option_id" })
  option: ProductOption

  @Column()
  variant_id: string

  @ManyToOne(
    () => ProductVariant,
    variant => variant.options
  )
  @JoinColumn({ name: "variant_id" })
  variant: ProductVariant

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date

  @DeleteDateColumn({ type: "timestamptz" })
  deleted_at: Date

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @BeforeInsert()
  private beforeInsert() {
    const id = randomize("Aa0", 16)
    this.id = `optval_${id}`
  }
}