import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as CliController from '../../controllers/cli';

const triggerValidateObject = {
  clitoken: Joi.string().required(),
  repository: Joi.string().required(),
  sha: Joi.string().required(),
  branch: Joi.string().required()
};

const router = Router();

router.post(
  '/trigger-scan',
  celebrate({
    [Segments.BODY]: Joi.object(triggerValidateObject)
  }),
  CliController.trigger
);

router.post(
  '/trigger-zip-scan',
  celebrate({
    [Segments.BODY]: Joi.object({ ...triggerValidateObject, fileName: Joi.string().required() })
  }),
  CliController.triggerZipScan
);

router.post(
  '/trigger-zip-scan-upload-url',
  celebrate({
    [Segments.BODY]: Joi.object({
      clitoken: Joi.string().required(),
      file: Joi.string().required()
    })
  }),
  CliController.uploadUrl
);

router.get(
  '/scan',
  celebrate(
    {
      [Segments.HEADERS]: Joi.object({
        clitoken: Joi.string().required(),
        idscan: Joi.string().required()
      })
    },
    {
      allowUnknown: true
    }
  ),
  CliController.getScan
);

export default router;
