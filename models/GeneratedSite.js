import mongoose, { Schema } from "mongoose";

const PictureSchema = new Schema(
  {
    type: { type: String, enum: ["image", "video", ""], default: "" },
    link: { type: String, default: "" }, // you can store URL here after upload
  },
  { _id: false }
);

const LinkSchema = new Schema(
  {
    id: { type: String, default: null },
    name: { type: String, default: "" },
    secName: { type: String, default: "" },
    pictures: {
      type: [PictureSchema],
      default: [
        { type: "", link: "" },
        { type: "", link: "" },
        { type: "", link: "" },
        { type: "", link: "" },
      ],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "pictures must contain exactly 4 items",
      },
    },
    why: { type: [String], default: [] },
    url: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GeneratedSiteSchema = new Schema(
  {
    id: { type: String, default: null },
    name: { type: String, default: null }, // your own name
    email: { type: String, default: null }, // your own email
    links: { type: [LinkSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.GeneratedSite ||
  mongoose.model("GeneratedSite", GeneratedSiteSchema);
