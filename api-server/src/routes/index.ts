import { Router, type IRouter } from "express";
import healthRouter from "./health";
import planningPokerRouter from "./planningPoker";

const router: IRouter = Router();

router.use(healthRouter);
router.use(planningPokerRouter);

export default router;
