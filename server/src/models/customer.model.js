import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
    ,
    cart: [
        {
          _id: false,
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
          },
          quantity: {
            type: Number,
            default: 1,
            min: 1
          }
        }
      ]
  },
  {
    timestamps: true
  }
);

export const Customer = mongoose.model("Customer", customerSchema);