import { NextFunction, Request, Response } from "express"
import { Between, getRepository, In } from "typeorm";
import { endOfDay, startOfDay, subWeeks } from 'date-fns';
import { map } from 'lodash';

import { GroupStudent } from "../entity/group-student.entity";
import { Group } from "../entity/group.entity";
import { Roll } from "../entity/roll.entity";
import { StudentRollState } from "../entity/student-roll-state.entity";
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface";
import { GroupStudentInput } from "../interface/group-student.interface";
import { Student } from "../entity/student.entity";

export class GroupController {
  private groupRepository = getRepository(Group)
  private studentGroupRepository = getRepository(GroupStudent);
  private studentRollRepository = getRepository(StudentRollState);
  private rollRepository = getRepository(Roll);
  private studentRepository = getRepository(Student);

  async allGroups(request: Request, response: Response, next: NextFunction) {
    return this.groupRepository.find()
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request;
    const groupInput: CreateGroupInput = {
      name: params.name,
      incidents: params.incidents,
      ltmt: params.ltmt,
      roll_states: params.roll_states,
      number_of_weeks: params.number_of_weeks
    }
    const group = new Group();
    group.prepareToCreate(groupInput)
    return this.groupRepository.save(group);
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request
    const group = await this.groupRepository.findOne(params.id);
    if (group) {
      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        incidents: params.incidents,
        ltmt: params.ltmt,
        roll_states: params.roll_states,
        number_of_weeks: params.number_of_weeks
      }
      group.prepareToUpdate(updateGroupInput)
      return this.groupRepository.save(group)
    }
    return { error: 'Group not found' }
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    let groupToRemove = await this.groupRepository.findOne(request.params.id);
    if (!groupToRemove) {
      return { error: 'Group is already deleted' }
    }
    await this.groupRepository.remove(groupToRemove)
    return null;
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Fetch all students in Group
    const students = await this.studentGroupRepository.find({
      where: {
        group_id: request.params.id
      },
      select: ['student_id']
    });
    // return list of students
    return this.studentRepository.createQueryBuilder('sr')
      .where('sr.id IN (:...students)', { students: students.map(student => student.student_id) })
      .select([
        'sr.id AS id',
        'sr.first_name AS first_name',
        'sr.last_name AS last_name',
        "sr.first_name || ' ' || sr.last_name AS full_name"
      ])
      .getRawMany();
  }

  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // 1. Clear out the groups (delete all the students from the groups)
    await this.studentGroupRepository.delete({});
    // 2. Fetch all the groups
    const groups = await this.groupRepository.find();
    return Promise.all(map(groups, async group => {
      const todaysDate = new Date();
      // 3. Find all rolls with group week filter
      const rolls = await this.rollRepository.find({
        where: {
          completed_at: Between(
            startOfDay(subWeeks(todaysDate, group.number_of_weeks)).toISOString(),
            endOfDay(todaysDate).toISOString()
          ),
        },
        select: ['id', 'completed_at']
      });
      // 4. Find matching students
      const matchingStudents = await this.studentRollRepository.createQueryBuilder('sg')
        .where('sg.state = :state', { state: group.roll_states })
        .andWhere('sg.roll_id IN (:...roll_ids)', { roll_ids: rolls.map(roll => roll.id) })
        .groupBy('sg.student_id')
        .having(`COUNT(sg.student_id) ${group.ltmt} :count`, { count: group.incidents })
        .select(['COUNT(sg.student_id) AS incident_count', 'sg.student_id AS student_id'])
        .getRawMany();
      // 5. Convert student to GroupStudent Input
      const groupStudents: GroupStudent[] = map(matchingStudents, (student) => {
        const createStudentRollStateInput: GroupStudentInput = {
          student_id: student.student_id,
          group_id: group.id,
          incident_count: student.incident_count
        }
        const studentRollState = new GroupStudent()
        studentRollState.prepareToCreate(createStudentRollStateInput)
        return studentRollState
      });
      // 6. Update Group
      group.run_at = new Date();
      group.student_count = groupStudents.length;
      await this.groupRepository.save(group);
      // 7. Save Group Student
      return this.studentGroupRepository.save(groupStudents);
    }));
  }
}
