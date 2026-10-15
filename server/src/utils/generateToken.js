import jwt from "jsonwebtoken";

export const generateToken = (customerId) => {
  return jwt.sign(
    { id: customerId },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );
};