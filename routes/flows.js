const express = require("express");
const router = express.Router();
const { Flow, Task, FlowLog } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { executeTask } = require("../services/taskExecutor");

router.get("/", function (req, res, next) {
  res.render("flow-builder");
});

// Create new flow
router.post("/flows", async (req, res) => {
  try {
    const { name, description, tasks } = req.body;

    const flow = await Flow.create({
      name,
      description,
      webhookToken: uuidv4(),
    });

    if (tasks && tasks.length > 0) {
      await Task.bulkCreate(
        tasks.map((task, index) => ({
          ...task,
          flowId: flow.id,
          sequence: index + 1,
          defaultInput: task.defaultInput || "",
        }))
      );
    }

    res.json({ success: true, flow });
  } catch (error) {
    console.error("Error creating flow:", error);
    res.status(500).json({ error: "Failed to create flow" });
  }
});

// Get all flows
router.get("/flows", async (req, res) => {
  try {
    const flows = await Flow.findAll({
      include: [
        {
          model: Task,
          as: "tasks",
          order: [["sequence", "ASC"]],
        },
      ],
    });
    res.json(flows);
  } catch (error) {
    console.error("Error fetching flows:", error);
    res.status(500).json({ error: "Failed to fetch flows" });
  }
});

// Execute flow via webhook
router.get("/webhook/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { payload } = req.query;

    const flow = await Flow.findOne({
      where: { webhookToken: token },
      include: [
        {
          model: Task,
          as: "tasks",
          order: [["sequence", "ASC"]],
        },
      ],
    });

    if (!flow) {
      return res.status(404).json({ error: "Flow not found" });
    }

    // Execute tasks sequentially
    for (const task of flow.tasks) {
      try {
        console.log("TASK", task);
        console.log({ flowTasks: flow.tasks[0].dataValues });
        const result = await executeTask(task, payload);
        await FlowLog.create({
          flowId: flow.id,
          taskId: task.id,
          input: payload,
          output: JSON.stringify(result),
          status: "SUCCESS",
        });
      } catch (error) {
        await FlowLog.create({
          flowId: flow.id,
          taskId: task.id,
          input: payload,
          error: error.message,
          status: "FAILURE",
        });
        return res
          .status(500)
          .json({ error: `Task execution failed: ${error.message}` });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error executing flow:", error);
    res.status(500).json({ error: "Failed to execute flow" });
  }
});

// Get flow logs
router.get("/flows/:id/logs", async (req, res) => {
  try {
    const logs = await FlowLog.findAll({
      where: { flowId: req.params.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Flow,
          as: "flow",
        },
      ],
    });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Render flow builder page
router.get("/flow-builder", (req, res) => {
  res.render("flow-builder");
});

module.exports = router;
