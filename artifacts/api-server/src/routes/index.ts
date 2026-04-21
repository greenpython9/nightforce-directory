import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileProofRouter from "./profileProof";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileProofRouter);

export default router;