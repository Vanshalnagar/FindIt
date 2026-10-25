import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { unauthorized, conflict } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;
// Compared against when the email is unknown so response time does not reveal account existence.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-1', ROUNDS);

const startSession = (req, user) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user._id.toString();
      req.session.save((e) => (e ? reject(e) : resolve()));
    });
  });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) throw conflict('An account with that email already exists');
  let user;
  try {
    user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, ROUNDS), role: 'student' });
  } catch (e) {
    if (e?.code === 11000) throw conflict('An account with that email already exists');
    throw e;
  }
  await startSession(req, user);
  res.status(201).json({ user: user.toPublic() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Invalid email or password');
  await startSession(req, user);
  res.json({ user: user.toPublic() });
});

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('findit.sid');
    res.json({ ok: true });
  });
};

export const me = (req, res) => res.json({ user: req.user.toPublic() });
