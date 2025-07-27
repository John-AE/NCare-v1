import { useLocation, Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface BreadcrumbConfig {
  path: string;
  label: string;
  roles?: string[];
}

const breadcrumbConfig: BreadcrumbConfig[] = [
  { path: "/", label: "Home" },
  { path: "/nurse-dashboard", label: "Nurse Dashboard", roles: ["nurse"] },
  { path: "/doctor-dashboard", label: "Doctor Dashboard", roles: ["doctor"] },
  { path: "/finance-dashboard", label: "Finance Dashboard", roles: ["finance"] },
  { path: "/record-visit", label: "Record Visit", roles: ["doctor"] },
];

export const AppBreadcrumb = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;

  // Don't show breadcrumbs on login page or home page
  if (currentPath === "/" || currentPath === "/login") {
    return null;
  }

  // Handle dynamic routes like /record-visit/:appointmentId
  let matchedPath = currentPath;
  if (currentPath.startsWith("/record-visit/")) {
    matchedPath = "/record-visit";
  }

  // Find the current page config
  const currentConfig = breadcrumbConfig.find(config => config.path === matchedPath);
  
  // If no config found or user doesn't have permission, don't show breadcrumbs
  if (!currentConfig || (currentConfig.roles && !currentConfig.roles.includes(profile?.role || ""))) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = [];

  // Always add home
  breadcrumbItems.push({
    path: "/",
    label: "Home",
    isLast: false
  });

  // Add dashboard based on user role
  if (profile?.role) {
    const dashboardPath = `/${profile.role}-dashboard`;
    const dashboardConfig = breadcrumbConfig.find(config => config.path === dashboardPath);
    
    if (dashboardConfig && matchedPath !== dashboardPath) {
      breadcrumbItems.push({
        path: dashboardPath,
        label: dashboardConfig.label,
        isLast: false
      });
    }
  }

  // Add current page (if it's not already the dashboard)
  if (currentConfig && !currentConfig.path.includes("dashboard")) {
    breadcrumbItems.push({
      path: matchedPath,
      label: currentConfig.label,
      isLast: true
    });
  } else if (currentConfig && currentConfig.path.includes("dashboard")) {
    // If we're on a dashboard, mark it as the last item
    breadcrumbItems[breadcrumbItems.length - 1] = {
      ...breadcrumbItems[breadcrumbItems.length - 1],
      isLast: true
    };
  }

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <div key={item.path} className="flex items-center">
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.path === "/" && <Home className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path} className="flex items-center gap-2 hover:text-primary transition-colors">
                      {item.path === "/" && <Home className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!item.isLast && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};