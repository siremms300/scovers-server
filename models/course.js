import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    slug: { 
      type: String,
      lowercase: true,
    },
    content: {
      type: {},
      minlength: 200,
    },
    video: {},
    free_preview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    // price is same as tuition 
    price: {
      type: Number,
      default: 9.99,
    }, 
    image: {},
    category: String,
    published: { 
      type: Boolean,
      default: false,
    },
    paid: {
      type: Boolean,
      default: true,
    }, 

    scholarship: {
      type: String, 
      default: false,
    },

    program: {
        type: String,
        enum: ["undergraduate", "masters", "phD"], // Enum restricts the program to these values
        default: "undergraduate", // Setting default program to "undergraduate"
        required: [true, 'program is required'], 
    },

    instructor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
