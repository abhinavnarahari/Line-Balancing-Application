// Pages are code-split per route (React.lazy); Layout/SettingsLayout render them inside <Suspense>.
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "../components/common/Layout";
import { LoginPage } from "../pages/auth/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";

// Masters
const ShiftsPage = lazy(() => import("../pages/shifts/ShiftsPage").then((m) => ({ default: m.ShiftsPage })));
const LinesPage = lazy(() => import("../pages/lines/LinesPage").then((m) => ({ default: m.LinesPage })));
const MachinesPage = lazy(() => import("../pages/machines/MachinesPage").then((m) => ({ default: m.MachinesPage })));
const OperatorsPage = lazy(() => import("../pages/operators/OperatorsPage").then((m) => ({ default: m.OperatorsPage })));
const OperatorDetailPage = lazy(() => import("../pages/operators/OperatorDetailPage").then((m) => ({ default: m.OperatorDetailPage })));
const OperationsPage = lazy(() => import("../pages/operations/OperationsPage").then((m) => ({ default: m.OperationsPage })));
const SizesPage = lazy(() => import("../pages/sizes/SizesPage").then((m) => ({ default: m.SizesPage })));
import { SettingsLayout } from "../pages/settings/SettingsLayout";
const UsersPage = lazy(() => import("../pages/settings/UsersPage").then((m) => ({ default: m.UsersPage })));

// Industrial Engineering & Planning
const CapacityPlanningPage = lazy(() => import("../pages/planning/CapacityPlanningPage").then((m) => ({ default: m.CapacityPlanningPage })));
const LineDesignPage = lazy(() => import("../pages/planning/LineDesignPage").then((m) => ({ default: m.LineDesignPage })));
const LineBalancePage = lazy(() => import("../pages/line-balance/LineBalancePage").then((m) => ({ default: m.LineBalancePage })));
const OperatorPlacementPage = lazy(() => import("../pages/line-balance/OperatorPlacementPage").then((m) => ({ default: m.OperatorPlacementPage })));
const ProductionMonitoringPage = lazy(() => import("../pages/line-balance/ProductionMonitoringPage").then((m) => ({ default: m.ProductionMonitoringPage })));

const ShiftAssignmentPage = lazy(() => import("../pages/workforce/ShiftAssignmentPage").then((m) => ({ default: m.ShiftAssignmentPage })));
const SkillMatrixPage = lazy(() => import("../pages/workforce/SkillMatrixPage").then((m) => ({ default: m.SkillMatrixPage })));
const AttendancePage = lazy(() => import("../pages/workforce/AttendancePage").then((m) => ({ default: m.AttendancePage })));

const StylesPage = lazy(() => import("../pages/production/StylesPage").then((m) => ({ default: m.StylesPage })));
const OrdersPage = lazy(() => import("../pages/production/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const BulletinsPage = lazy(() => import("../pages/production/BulletinsPage").then((m) => ({ default: m.BulletinsPage })));

const SkillMatrixLogsPage = lazy(() => import("../pages/workforce/SkillMatrixLogsPage").then((m) => ({ default: m.SkillMatrixLogsPage })));
const ImmediateActionsPage = lazy(() => import("../pages/workforce/ImmediateActionsPage").then((m) => ({ default: m.ImmediateActionsPage })));
const PlantDashboardPage = lazy(() => import("../pages/dashboards/PlantDashboardPage").then((m) => ({ default: m.PlantDashboardPage })));
const LineDashboardPage = lazy(() => import("../pages/dashboards/LineDashboardPage").then((m) => ({ default: m.LineDashboardPage })));
const OverallDashboardPage = lazy(() => import("../pages/dashboards/OverallDashboardPage").then((m) => ({ default: m.OverallDashboardPage })));
const OperatorAllocationPage = lazy(() => import("../pages/allocation/OperatorAllocationPage").then((m) => ({ default: m.OperatorAllocationPage })));

export const router = createBrowserRouter([
  // Public Authentication Route
  {
    path: "/login",
    element: <LoginPage />,
  },

  // Protected Factory Application Routes
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboards
      { index: true, element: <OverallDashboardPage /> },
      { path: "overall-dashboard", element: <OverallDashboardPage /> },
      { path: "plant-dashboard",   element: <PlantDashboardPage /> },
      { path: "line-dashboard",    element: <LineDashboardPage /> },

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
          { path: "users",       element: <ProtectedRoute roles={["SYSTEM_ADMIN"]}><UsersPage /></ProtectedRoute> },
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

      // Multi-Line Optimization & Balancing
      { path: "operator-allocation",     element: <OperatorAllocationPage /> },
      { path: "multi-line-optimizer",   element: <OperatorAllocationPage /> },
      { path: "line-balance",            element: <LineBalancePage fixedMode="DELIVERY" /> },
      { path: "planned-lines",           element: <LineBalancePage fixedMode="DELIVERY" /> },
      { path: "fixed-shift-target",      element: <LineBalancePage fixedMode="SHIFT_TARGET" /> },
      { path: "shift-target",            element: <LineBalancePage fixedMode="SHIFT_TARGET" /> },
      { path: "operator-placement",       element: <OperatorPlacementPage /> },
      { path: "monitoring",               element: <ProductionMonitoringPage /> },
      { path: "production-monitoring",    element: <ProductionMonitoringPage /> },
      { path: "production-logs",          element: <ProductionMonitoringPage /> },
      { path: "hourly-board",             element: <ProductionMonitoringPage /> },
    ],
  },

  // Fallback Wildcard Route -> redirect to root
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
