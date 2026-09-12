import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "../components/common/Layout";
import { Dashboard } from "../pages/Dashboard";

// Masters
import { ShiftsPage } from "../pages/shifts/ShiftsPage";
import { LinesPage } from "../pages/lines/LinesPage";
import { MachinesPage } from "../pages/machines/MachinesPage";
import { OperatorsPage } from "../pages/operators/OperatorsPage";
import { OperatorDetailPage } from "../pages/operators/OperatorDetailPage";
import { OperationsPage } from "../pages/operations/OperationsPage";
import { SizesPage } from "../pages/sizes/SizesPage";
import { SettingsLayout } from "../pages/settings/SettingsLayout";

// Industrial Engineering & Planning
import { CapacityPlanningPage } from "../pages/planning/CapacityPlanningPage";
import { LineDesignPage } from "../pages/planning/LineDesignPage";
import { LineBalancePage } from "../pages/line-balance/LineBalancePage";
import { OperatorPlacementPage } from "../pages/line-balance/OperatorPlacementPage";
import { ProductionMonitoringPage } from "../pages/line-balance/ProductionMonitoringPage";

import { ShiftAssignmentPage } from "../pages/workforce/ShiftAssignmentPage";
import { SkillMatrixPage } from "../pages/workforce/SkillMatrixPage";
import { AttendancePage } from "../pages/workforce/AttendancePage";

import { StylesPage } from "../pages/production/StylesPage";
import { OrdersPage } from "../pages/production/OrdersPage";
import { BulletinsPage } from "../pages/production/BulletinsPage";

import { SkillMatrixLogsPage } from "../pages/workforce/SkillMatrixLogsPage";
import { ImmediateActionsPage } from "../pages/workforce/ImmediateActionsPage";
import { PlantDashboardPage } from "../pages/dashboards/PlantDashboardPage";
import { LineDashboardPage } from "../pages/dashboards/LineDashboardPage";
import { OverallDashboardPage } from "../pages/dashboards/OverallDashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // Dashboards
      { index: true, element: <Dashboard /> },
      { path: "plant-dashboard",   element: <PlantDashboardPage /> },
      { path: "line-dashboard",    element: <LineDashboardPage /> },
      { path: "overall-dashboard", element: <OverallDashboardPage /> },

      // Settings & Masters
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <ShiftsPage /> }, // Default to shifts
          { path: "shifts",      element: <ShiftsPage /> },
          { path: "lines",       element: <LinesPage /> },
          { path: "machines",    element: <MachinesPage /> },
          { path: "operators",   element: <OperatorsPage /> },
          { path: "operations",  element: <OperationsPage /> },
          { path: "sizes",       element: <SizesPage /> },
          { path: "styles",      element: <StylesPage /> },
        ]
      },

      // Direct Top-Level Aliases for Master Data
      { path: "operations",  element: <Navigate to="/settings/operations" replace /> },
      { path: "operators",   element: <Navigate to="/settings/operators" replace /> },
      { path: "machines",    element: <Navigate to="/settings/machines" replace /> },
      { path: "shifts",      element: <Navigate to="/settings/shifts" replace /> },
      { path: "lines",       element: <Navigate to="/settings/lines" replace /> },
      { path: "sizes",       element: <Navigate to="/settings/sizes" replace /> },
      { path: "styles",      element: <Navigate to="/settings/styles" replace /> },

      // Workforce
      { path: "settings/operators/:id", element: <OperatorDetailPage /> },
      { path: "shift-assignment", element: <ShiftAssignmentPage /> },
      { path: "attendance",       element: <AttendancePage /> },
      { path: "immediate-actions", element: <ImmediateActionsPage /> },
      { path: "skill-matrix",     element: <SkillMatrixPage /> },
      { path: "skill-matrix/logs", element: <SkillMatrixLogsPage /> },

      // Production & Orders
      { path: "orders",             element: <OrdersPage /> },
      { path: "operation-bulletins",element: <BulletinsPage /> },

      // Industrial Engineering, Capacity & Line Design
      { path: "capacity-planning",  element: <CapacityPlanningPage /> },
      { path: "capacity_planning",  element: <CapacityPlanningPage /> },
      { path: "line-design",        element: <LineDesignPage /> },
      { path: "line_design",        element: <LineDesignPage /> },

      // Line Balancing & Operations
      { path: "line-balance",            element: <LineBalancePage fixedMode="DELIVERY" /> },
      { path: "planned-lines",           element: <LineBalancePage fixedMode="DELIVERY" /> },
      { path: "fixed-shift-target",      element: <LineBalancePage fixedMode="SHIFT_TARGET" /> },
      { path: "shift-target",            element: <LineBalancePage fixedMode="SHIFT_TARGET" /> },
      { path: "operator-placement",       element: <OperatorPlacementPage /> },
      { path: "monitoring",               element: <ProductionMonitoringPage /> },
      { path: "production-monitoring",    element: <ProductionMonitoringPage /> },
      { path: "hourly-board",             element: <ProductionMonitoringPage /> },
    ],
  },
]);
