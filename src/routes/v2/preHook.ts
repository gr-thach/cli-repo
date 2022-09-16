import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as PreHookController from '../../controllers/preHook';

const router = Router();

/**
 * @swagger
 *  /v2/pre-hook/trigger-scan:
 *      post:
 *          summary: trigger a new pre-hook scan
 *          description: Create a new pre-hook scan to check commit for vulnerabilities
 *          tags:
 *              - PreHook
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: cliToken
 *                description: CLI token of the organization
 *                in: body
 *                required: true
 *                type: string
 *              - name: repositoryProviderInternalId
 *                description: id of the repository as defined in the git provider
 *                example: "123"
 *                in: body
 *                required: true
 *                type: string
 *              - name: sha
 *                description: sha of the commit that will be scanned
 *                example: "e26fe25a26f504d8ee0a7d70babbf90ba6cb99f1"
 *                in: body
 *                required: true
 *                type: string
 *              - name: branch
 *                description: name of the branch that will be scanned
 *                example: "main"
 *                in: body
 *                required: true
 *                type: string
 *              - name: gitArchiveFileName
 *                description: file name of the git archive that has been uploaded
 *                example: "ecd00941-7433-42cf-a9c2-ec0edee0202e"
 *                in: body
 *                required: true
 *                type: string
 *              - name: gitDiffFileName
 *                description: file name of the git diff file that has been uploaded
 *                example: "91a2e59e-372b-48fe-b7e4-dcf840a57331"
 *                in: body
 *                required: true
 *                type: string
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the id and link to the newly created scan.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  idScan:
 *                                      type: string
 *                                      example: "57095202-98cb-44eb-9075-43ea9e2847c3"
 *                                  dashboardUrl:
 *                                      type: string
 *                                      example: "https://dashboard.guardrails-instance.com/gl/test-user/scans?sha=e26fe25a26f504d8ee0a7d70babbf90ba6cb99f1"
 */
router.post(
  '/trigger-scan',
  celebrate({
    [Segments.BODY]: Joi.object({
      cliToken: Joi.string(),
      preHookToken: Joi.string(),
      repositoryProviderInternalId: Joi.string().required(),
      sha: Joi.string().required(),
      branch: Joi.string().required(),
      gitArchiveFileName: Joi.string().required(),
      gitDiffFileName: Joi.string().required(),
      provider: Joi.string()
    })
  }),
  PreHookController.trigger
);

/**
 * @swagger
 * /v2/pre-hook/upload-url:
 *   post:
 *     summary: Create a unique upload url
 *     description: Create a unique url that can be used to upload Git archive and Git diff to be scanned
 *     tags:
 *      - PreHook
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: cliToken
 *         type: string
 *         required: true
 *         description: CLI token for the organization
 *     responses:
 *         200:
 *             description:  Successful operation. Returns the url for uploading the file and the filename.
 *             content:
 *                 application/json:
 *                     schema:
 *                         type: object
 *                         properties:
 *                             signedUrl:
 *                                 type: string
 *                             fileName:
 *                                 type: string
 */
router.post('/upload-url', PreHookController.uploadUrl);

/**
 * @swagger
 * /v2/pre-hook/scan:
 *   get:
 *     summary: Get scan information
 *     description: Get information about a specific scan
 *     tags:
 *      - PreHook
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: cliToken
 *         type: string
 *         required: true
 *         description: CLI token of the organization
 *       - in: query
 *         name: idScan
 *         type: string
 *         required: true
 *         description: Id of the scan that should be looked up
 *     responses:
 *         200:
 *             description:  Successful operation. Returns details about the scan.
 *             content:
 *                 application/json:
 *                     schema:
 *                         type: array
 *                         items:
 *                             $ref: "#/components/schemas/scan"
 */
router.get(
  '/scan',
  celebrate({
    [Segments.QUERY]: Joi.object({
      cliToken: Joi.string(),
      preHookToken: Joi.string(),
      idScan: Joi.string().required(),
      provider: Joi.string()
    })
  }),
  PreHookController.getScan
);

/**
 * @swagger
 * /v2/pre-hook/version:
 *   get:
 *     summary: Check pre-hook plugin version compatibility
 *     description: Check pre-hook plugin version compatibility
 *     tags:
 *      - PreHook
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: provier
 *         type: string
 *         required: true
 *         description: Git provider name
 *       - in: query
 *         name: version
 *         type: string
 *         required: true
 *         description: The version number of the pre-hook plugin
 *     responses:
 *         200:
 *             description:  Successful operation. Returns information about compatibility of the pre-hook plugin.
 *             content:
 *                 application/json:
 *                     schema:
 *                         type: object
 *                         properties:
 *                             status:
 *                                 type: string
 *                             info:
 *                                 type: string
 */
router.get(
  '/version',
  celebrate({
    [Segments.QUERY]: Joi.object({
      provider: Joi.string().required(),
      version: Joi.string().required()
    })
  }),
  PreHookController.getVersion
);

/**
 * @swagger
 * /v2/pre-hook/version:
 *   get:
 *     summary: Check pre-hook plugin version compatibility
 *     description: Check pre-hook plugin version compatibility
 *     tags:
 *      - PreHook
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: cliToken
 *         type: string
 *         required: false
 *         description: CLI token of the organization
 *       - in: query
 *         name: preHookToken
 *         type: string
 *         required: false
 *         description: Pre-hook token secret
 *       - in: query
 *         name: provier
 *         type: string
 *         required: true
 *         description: Git provider name
 *       - in: query
 *         name: repositoryProviderInternalId
 *         type: string
 *         required: true
 *         description: id of the repository as defined in the git provider
 *     responses:
 *         200:
 *             description:  Successful operation. Returns information about compatibility of the pre-hook plugin.
 *             content:
 *                 application/json:
 *                     schema:
 *                         type: object
 *                         properties:
 *                             status:
 *                                 type: string
 *                             info:
 *                                 type: string
 */
router.get(
  '/configuration',
  celebrate({
    [Segments.QUERY]: Joi.object({
      cliToken: Joi.string(),
      preHookToken: Joi.string(),
      provider: Joi.string().required(),
      repositoryProviderInternalId: Joi.string().required()
    })
  }),
  PreHookController.getConfiguration
);

export default router;
