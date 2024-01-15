import express from 'express';
import assetsRoutes from './assets.js';
import authRoutes from './auth.js';
import invitesRoutes from './invites.js';
import meetingTemplatesRoutes from './meetingTemplates.js';
import meetingsRoutes from './meetings.js';
import passwordsRoutes from './passwords.js';
import photosRoutes from './photos.js';
import usersRoutes from './users.js';

const router = express.Router();

router.use('/assets', assetsRoutes);
router.use('/auth', authRoutes);
router.use('/invites', invitesRoutes);
router.use('/meetings/templates', meetingTemplatesRoutes);
router.use('/meetings', meetingsRoutes);
router.use('/passwords', passwordsRoutes);
router.use('/photos', photosRoutes);
router.use('/users', usersRoutes);

export default router;
