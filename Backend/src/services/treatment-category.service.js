const TreatmentCategory = require('../models/treatment-category.model');
const Clinic = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');

async function getDefaultClinic() {
  let clinic = await Clinic.findOne({});
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Dwarka Dental Clinic',
      email: 'info@dwarkadental.com',
      phone: '+91 98765 00000',
      address: { street: 'Sector 12', city: 'Dwarka, New Delhi', state: 'Delhi', zipCode: '110075' }
    });
  }
  return clinic;
}

/**
 * List treatment categories with optional search / filter / sort.
 * @param {object} query  { search, status, sortBy, sortOrder }
 */
async function getCategories(query = {}) {
  const clinic = await getDefaultClinic();
  const { search, status, sortBy = 'name', sortOrder = 'asc' } = query;

  const filter = {
    $or: [{ clinicId: clinic._id }, { clinicId: { $exists: false } }],
  };
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const sortField = {
    name: 'name',
    code: 'code',
    duration: 'defaultDurationMinutes',
    followup: 'defaultFollowUpDays',
    newest: 'createdAt',
    oldest: 'createdAt',
  }[sortBy] || 'name';

  const sortDir = sortBy === 'oldest' ? 1 : (sortOrder === 'desc' ? -1 : 1);

  const cats = await TreatmentCategory.find(filter)
    .sort({ [sortField]: sortDir })
    .lean();

  return cats.map(toShape);
}

/**
 * Create a treatment category.
 * @param {object} body  { name, code, defaultDurationMinutes, defaultFollowUpDays, isActive }
 */
async function createCategory(body) {
  const clinic = await getDefaultClinic();
  const { name, code, defaultDurationMinutes, defaultFollowUpDays, isActive } = body;

  // Duplicate code check within clinic
  const existing = await TreatmentCategory.findOne({ clinicId: clinic._id, code: code.toUpperCase() });
  if (existing) throw ApiError.badRequest(`Treatment code "${code.toUpperCase()}" already exists.`);

  const cat = await TreatmentCategory.create({
    clinicId: clinic._id,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    defaultDurationMinutes: defaultDurationMinutes || 30,
    defaultFollowUpDays: defaultFollowUpDays !== undefined ? defaultFollowUpDays : 30,
    isActive: isActive !== undefined ? isActive : true,
  });

  return toShape(cat.toObject());
}

/**
 * Update a treatment category.
 * @param {string} id   Category _id
 * @param {object} body Fields to update
 */
async function updateCategory(id, body) {
  const cat = await TreatmentCategory.findById(id);
  if (!cat) throw ApiError.notFound('Treatment category not found.');

  const allowed = ['name', 'code', 'defaultDurationMinutes', 'defaultFollowUpDays', 'isActive'];
  for (const field of allowed) {
    if (body[field] !== undefined) {
      cat[field] = field === 'code' ? body[field].toUpperCase() : body[field];
    }
  }
  await cat.save();
  return toShape(cat.toObject());
}

/**
 * Toggle active/inactive status.
 * @param {string}  id       Category _id
 * @param {boolean} isActive New status
 */
async function toggleActive(id, isActive) {
  const cat = await TreatmentCategory.findByIdAndUpdate(
    id,
    { isActive },
    { new: true },
  );
  if (!cat) throw ApiError.notFound('Treatment category not found.');
  return toShape(cat.toObject());
}

// ─── Shape ────────────────────────────────────────────────────────────────────
function toShape(c) {
  return {
    id: c._id.toString(),
    name: c.name,
    code: c.code,
    defaultDurationMinutes: c.defaultDurationMinutes || 30,
    defaultFollowUpDays: c.defaultFollowUpDays !== undefined ? c.defaultFollowUpDays : 30,
    isActive: c.isActive,
    createdAt: c.createdAt,
  };
}

module.exports = { getCategories, createCategory, updateCategory, toggleActive };
