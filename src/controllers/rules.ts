import { Request, Response } from 'express';
import { listGrRules } from '../helpers/core-api/grRules';
import { allowedLanguages } from '../helpers/yml';
import { GrRule } from '../interfaces';

export const listRules = async (req: Request, res: Response) => {
  const rules: GrRule[] = await listGrRules();

  return res.status(200).send(
    rules.map(x => ({
      ...x,
      languages: Object.assign({}, ...allowedLanguages.map(language => ({ [language]: true })))
    }))
  );
};
