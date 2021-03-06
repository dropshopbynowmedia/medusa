import {
  Entity,
  Index,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { ulid } from "ulid"

import { Customer } from "./customer"
import { Country } from "./country"

@Entity()
export class Address {
  @PrimaryColumn()
  id: string

  @Index()
  @Column({ nullable: true })
  customer_id: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customer_id" })
  customer: Customer

  @Column({ nullable: true })
  company: string

  @Column({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  last_name: string

  @Column({ nullable: true })
  address_1: string

  @Column({ nullable: true })
  address_2: string

  @Column({ nullable: true })
  city: string

  @Column({ nullable: true })
  country_code: string

  @ManyToOne(() => Country)
  @JoinColumn({ name: "country_code", referencedColumnName: "iso_2" })
  country: Country

  @Column({ nullable: true })
  province: string

  @Column({ nullable: true })
  postal_code: string

  @Column({ nullable: true })
  phone: string

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
    if (this.id) return
    const id = ulid()
    this.id = `addr_${id}`
  }
}
