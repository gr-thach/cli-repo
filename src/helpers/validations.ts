import { Joi } from 'celebrate';

export const validateLimit = {
  limit: Joi.number()
    .integer()
    .greater(0)
};

export const validateOffset = {
  offset: Joi.number()
    .integer()
    .min(0)
};

export const validateAccountId = {
  accountId: Joi.number()
    .integer()
    .required()
};
