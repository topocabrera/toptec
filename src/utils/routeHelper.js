// Helper para generar rutas dinámicas según el rol del usuario
export const getRoutePrefix = (userRole) => {
  switch (userRole) {
    case 'max':
    case 'max-vendedor':
      return '/max';
    case 'nico':
      return '/nico';
    case 'windy':
    case 'windy-vendedor':
    case 'admin':
      return '/logistic';
    default:
      return '/logistic';
  }
};

// Función para obtener el usuario actual
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
};

// Función para verificar si el usuario tiene un permiso específico
export const hasPermission = (permission) => {
  const currentUser = getCurrentUser();
  const role = currentUser?.rol;
  
  // Definir permisos por rol
  const permissions = {
    'admin': ['view_cost_price', 'edit_products', 'change_prices', 'create_orders', 'edit_orders', 'view_purchases'],
    'windy': ['view_cost_price', 'edit_products', 'change_prices', 'create_orders', 'edit_orders', 'view_purchases'],
    'max': ['view_cost_price', 'edit_products', 'change_prices', 'create_orders', 'edit_orders', 'view_purchases'],
    'nico': ['edit_products', 'view_products', 'bulk_products'], // Solo productos: crear, listar, editar, eliminar, carga masiva
    'max-vendedor': ['create_orders', 'view_products'], // Solo puede crear pedidos y ver productos (sin precio costo)
    'windy-vendedor': ['create_orders', 'view_products'], // Solo puede crear pedidos y ver productos (sin precio costo)
  };

  return permissions[role]?.includes(permission) || false;
};

// Función para verificar si el usuario puede ver el precio de costo
export const canViewCostPrice = () => hasPermission('view_cost_price');

// Función para verificar si el usuario puede editar productos
export const canEditProducts = () => hasPermission('edit_products');

// Función para verificar si el usuario puede cambiar precios
export const canChangePrice = () => hasPermission('change_prices');

// Función para detectar el rol automáticamente desde la URL actual
export const getRoleFromPath = () => {
  const path = window.location.pathname;
  if (path.startsWith('/nico/')) {
    return 'nico';
  }
  if (path.startsWith('/max/')) {
    // Si está en /max/, verificar si es max o max-vendedor según el usuario actual
    const currentUser = getCurrentUser();
    if (currentUser?.rol === 'max-vendedor') {
      return 'max-vendedor';
    }
    return 'max';
  } else if (path.startsWith('/logistic/')) {
    // Si está en /logistic/, verificar si es windy o windy-vendedor según el usuario actual
    const currentUser = getCurrentUser();
    if (currentUser?.rol === 'windy-vendedor') {
      return 'windy-vendedor';
    }
    return 'windy';
  } else {
    // Fallback al rol del usuario actual
    const currentUser = getCurrentUser();
    return currentUser?.rol || 'windy';
  }
};

export const generateRoute = (userRole, path) => {
  const prefix = getRoutePrefix(userRole);
  return `${prefix}${path}`;
};

// Función para obtener el servicio correcto según el rol
export const getServiceByRole = (userRole, serviceType) => {
  if (userRole === 'nico') {
    if (serviceType === 'productos') {
      return require('../services/productos-nico.service').default;
    }
    return null;
  }
  if (userRole === 'max' || userRole === 'max-vendedor') {
    switch (serviceType) {
      case 'productos':
        return require('../services/productos-max.service').default;
      case 'clientes':
        return require('../services/clients-max.service').default;
      case 'pedidos':
        return require('../services/pedidos-max.service').default;
      case 'compras':
        return require('../services/compras-max.service').default;
      default:
        return null;
    }
  } else {
    // Para 'windy', 'windy-vendedor' y 'admin' usar los servicios originales
    switch (serviceType) {
      case 'productos':
        return require('../services/productos.service').default;
      case 'clientes':
        return require('../services/clients.service').default;
      case 'pedidos':
        return require('../services/pedidos.service').default;
      case 'compras':
        return require('../services/compras.service').default;
      default:
        return null;
    }
  }
};

// Función inteligente que detecta automáticamente el rol y devuelve el servicio correcto
export const getSmartService = (serviceType) => {
  const roleFromPath = getRoleFromPath();
  return getServiceByRole(roleFromPath, serviceType);
};

// Función para generar rutas inteligentes basadas en el contexto actual
export const generateSmartRoute = (path) => {
  const roleFromPath = getRoleFromPath();
  return generateRoute(roleFromPath, path);
}; 