import Service from "../models/Service.js";

export async function getServices(req, res) {
  try {
    const isAdmin = Boolean(req.admin);
    const filter = {};

    if (!isAdmin) filter.published = true;
    if (req.query.status === "published") filter.published = true;
    if (req.query.status === "draft") filter.published = false;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const services = await Service.find(filter).sort({ createdAt: -1 }).limit(limit);

    return res.json({ success: true, data: services });
  } catch (error) {
    console.error("Get services error:", error);
    return res.status(500).json({ success: false, message: "Failed to load services." });
  }
}

export async function getService(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || (!req.admin && !service.published)) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }
    return res.json({ success: true, data: service });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid service id." });
  }
}

export async function createService(req, res) {
  try {
    const { title, slug, category, description = "", price = 0, icon = "", published = true } = req.body;
    if (!title?.trim() || !slug?.trim() || !category?.trim()) {
      return res.status(400).json({ success: false, message: "Title, slug and category are required." });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ success: false, message: "Price must be a valid non-negative number." });
    }

    const service = await Service.create({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      category: category.trim(),
      description: String(description).trim(),
      price: numericPrice,
      icon: String(icon).trim(),
      published: Boolean(published),
    });

    return res.status(201).json({ success: true, message: "Service created successfully.", data: service });
  } catch (error) {
    console.error("Create service error:", error);
    const status = error?.code === 11000 ? 409 : 400;
    return res.status(status).json({ success: false, message: error.message || "Unable to create service." });
  }
}

export async function updateService(req, res) {
  try {
    const { title, slug, category, description, price, icon, published } = req.body;
    const update = {};

    if (title !== undefined) update.title = String(title).trim();
    if (slug !== undefined) update.slug = String(slug).trim().toLowerCase();
    if (category !== undefined) update.category = String(category).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (icon !== undefined) update.icon = String(icon).trim();
    if (published !== undefined) update.published = Boolean(published);

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ success: false, message: "Price must be a valid non-negative number." });
      }
      update.price = numericPrice;
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.json({ success: true, message: "Service updated successfully.", data: service });
  } catch (error) {
    console.error("Update service error:", error);
    const status = error?.code === 11000 ? 409 : 400;
    return res.status(status).json({ success: false, message: error.message || "Unable to update service." });
  }
}

export async function deleteService(req, res) {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: "Service not found." });
    return res.json({ success: true, message: "Service deleted successfully." });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Unable to delete service." });
  }
}
