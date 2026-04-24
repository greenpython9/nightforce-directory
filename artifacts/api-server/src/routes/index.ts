import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileProofRouter from "./profileProof";
import contactModeRouter from "./contactMode";
import nightforceRouter from "./nightforce";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileProofRouter);
router.use(contactModeRouter);
router.use(nightforceRouter);

export default router;