import {
  Entity,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinTable,
  JoinColumn,
} from "typeorm"
import randomize from "randomatic"

import { Currency } from "./currency"
import { Country } from "./country"
import { PaymentProvider } from "./payment-provider"
import { FulfillmentProvider } from "./fulfillment-provider"

@Entity()
export class Region {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column()
  currency_code: string

  @ManyToOne(() => Currency)
  @JoinColumn({ name: "currency_code", referencedColumnName: "code" })
  currency: Currency

  @Column({ type: "decimal" })
  tax_rate: number

  @Column({ nullable: true })
  tax_code: string

  @OneToMany(
    () => Country,
    c => c.region
  )
  countries: Country[]

  @ManyToMany(() => PaymentProvider)
  @JoinTable({
    name: "region_payment_providers",
    joinColumn: {
      name: "region_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "provider_id",
      referencedColumnName: "id",
    },
  })
  payment_providers: PaymentProvider[]

  @ManyToMany(() => FulfillmentProvider)
  @JoinTable({
    name: "region_fulfillment_providers",
    joinColumn: {
      name: "region_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "provider_id",
      referencedColumnName: "id",
    },
  })
  fulfillment_providers: FulfillmentProvider[]

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
    const id = randomize("Aa0", 24)
    this.id = `reg_${id}`
  }
}