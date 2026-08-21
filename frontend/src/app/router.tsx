import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/common/Layout";
import { Dashboard } from "../pages/Dashboard";

// Masters
import { ShiftsPage } from "../pages/shifts/ShiftsPage";
import { OperatorsPage } from "../pages/operators/OperatorsPage";
import { OperationsPage } from "../pages/operations/OperationsPage";
import { SizesPage } from "../pages/sizes/SizesPage";
import { SettingsLayout } from "../pages/settings/SettingsLayout";

import { LineBalancePage } from "../pages/line-balance/LineBalancePage";
import { OperatorPlacementPage } from "../pages/line-balance/OperatorPlacementPage";
import { ProductionMonitoringPage } from "../pages/line-balance/ProductionMonitoringPage";

import { ShiftAssignmentPage } from "../pages/workforce/ShiftAssignmentPage";
import { SkillMatrixPage } from "../pages/workforce/SkillMatrixPage";
import { AttendancePage } from "../pages/workforce/AttendancePage";

import { StylesPage } from "../pages/production/StylesPage";
import { OrdersPage } from "../pages/production/OrdersPage";
import { BulletinsPage } from "../pages/production/BulletinsPage";



export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // Dashboard
      { index: true, element: <Dashboard /> },

      // Settings & Masters
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <ShiftsPage /> }, // Default to shifts
          { path: "shifts",      element: <ShiftsPage /> },
          { path: "operators",   element: <OperatorsPage /> },
          { path: "operations",  element: <OperationsPage /> },
          { path: "sizes",       element: <SizesPage /> },
          { path: "styles",      element: <StylesPage /> },
        ]
      },

      // Workforce
      { path: "shift-assignment", element: <ShiftAssignmentPage /> },
      { path: "attendance",       element: <AttendancePage /> },
      { path: "skill-matrix",     element: <SkillMatrixPage /> },

      // Production
      { path: "orders",             element: <OrdersPage /> },
      { path: "operation-bulletins",element: <BulletinsPage /> },

      // Line Balancing
      { path: "line-balance",      element: <LineBalancePage /> },
      { path: "operator-placement", element: <OperatorPlacementPage /> },
      { path: "monitoring",         element: <ProductionMonitoringPage /> },
    ],
  },
]);
