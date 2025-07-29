import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// We create a token using jwt.sign()
// { id }: this is the data we're storing in the token (user's id)
// JWT_SECRET: like a password used to sign the token
// expiresIn: "30d": token will expire in 30 days
// You can think of it like:
// "Make a signed secret note for this user ID, which is valid for 30 days."
