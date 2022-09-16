import { Request, Response } from 'express';
import { findAllRoles, findAllTeamRoles } from '../helpers/core-api/roles';
import { UserRole, TeamRole } from '../interfaces';

export const list = async (req: Request, res: Response) => {
  const roles: UserRole[] = await findAllRoles();
  return res.status(200).send(roles);
};

export const listTeamRoles = async (req: Request, res: Response) => {
  const teamRoles: TeamRole[] = await findAllTeamRoles();
  return res.status(200).send(teamRoles);
};
