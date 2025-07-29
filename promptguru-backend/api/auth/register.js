// authRoutes.js
router.post('/register', verifyFirebaseToken, async (req, res) => {
  const { email, name } = req.body;

  try {
    // Check if user exists in MongoDB
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists in MongoDB' });
    }

    // Create user in MongoDB
    const user = new User({
      email,
      name,
      emailVerified: false, // or true if you update later
    });

    await user.save();
    return res.status(201).json({ message: 'User created in MongoDB' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
