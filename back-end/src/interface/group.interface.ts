export interface CreateGroupInput {
  name: string;
  number_of_weeks: number;
  roll_states: string;
  incidents: number;
  ltmt: string;
}

export interface UpdateGroupInput extends CreateGroupInput {
  id: number;
}