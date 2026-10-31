import prisma from '../config/db.js';
import { generatePrototype, modifyPrototypeWithAI, PROTOTYPE_BLUEPRINTS } from '../services/prototype/prototypeService.js';
import { prototypeModifySchema } from '../validators/schemas.js';

export const getTemplates = async (req, res) => {
  res.json({
    success: true,
    templates: Object.keys(PROTOTYPE_BLUEPRINTS).map((key) => ({
      systemType: PROTOTYPE_BLUEPRINTS[key].systemType,
      name: PROTOTYPE_BLUEPRINTS[key].systemName,
      tagline: PROTOTYPE_BLUEPRINTS[key].tagline,
      modulesCount: PROTOTYPE_BLUEPRINTS[key].modules.length,
      primaryColor: PROTOTYPE_BLUEPRINTS[key].theme.primaryColor,
    })),
  });
};

export const createOrGetPrototype = async (req, res, next) => {
  try {
    const { conversationId, systemType } = req.body;
    const result = await generatePrototype(conversationId, systemType);

    res.json({
      success: true,
      message: 'Prototype generated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const modifyPrototype = async (req, res, next) => {
  try {
    const { prototypeId, prompt } = prototypeModifySchema.parse(req.body);
    const result = await modifyPrototypeWithAI(prototypeId, prompt);

    res.json({
      success: true,
      message: 'Prototype modified successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getPrototypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prototype = await prisma.prototype.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        conversation: { select: { id: true, title: true, requirements: { take: 1 } } },
      },
    });

    if (!prototype) {
      return res.status(404).json({ success: false, message: 'Prototype not found' });
    }

    const currentVersion = prototype.versions.find((v) => v.id === prototype.currentVersionId) || prototype.versions[0];

    res.json({
      success: true,
      data: {
        ...prototype,
        currentVersion,
        configuration: currentVersion?.configuration,
      },
    });
  } catch (err) {
    next(err);
  }
};
