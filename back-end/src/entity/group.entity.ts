import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  number_of_weeks: number

  @Column()
  roll_states: string

  @Column()
  incidents: number

  @Column()
  ltmt: string

  @Column({
    nullable: true,
  })
  run_at: Date

  @Column({
    nullable: false,
    default: 0
  })
  student_count: number

  public prepareToCreate(input: CreateGroupInput) {
    this.name = input.name;
    this.incidents = input.incidents;
    this.ltmt = input.ltmt;
    this.roll_states = input.roll_states;
    this.number_of_weeks = input.number_of_weeks;
  }

  public prepareToUpdate(input: UpdateGroupInput) {
    if (input.name) this.name = input.name;
    if (input.incidents) this.incidents = input.incidents;
    if (input.ltmt) this.ltmt = input.ltmt;
    if (input.roll_states) this.roll_states = input.roll_states;
    if (input.number_of_weeks) this.number_of_weeks = input.number_of_weeks;
  }

}
