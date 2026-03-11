export type Language = 'en' | 'es';

export const translations = {
  en: {
    // Tabs
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    accounts: 'Accounts',
    categories: 'Categories',
    budgets: 'Budgets',
    insights: 'Insights',
    settings: 'Settings',
    chartTitle: 'Expenses by Category (This Month)',

    // Dashboard
    totalBalance: 'Total Balance',
    monthlyIncome: 'Monthly Income',
    monthlyExpenses: 'Monthly Expenses',
    recentTransactions: 'Recent Transactions',
    noRecentTransactions: 'No recent transactions',

    // Settings
    preferences: 'Preferences',
    manageAccounts: 'Manage Accounts',
    manageCategories: 'Manage Categories',
    manageBudgets: 'Manage Budgets',
    language: 'Language',
    currency: 'Currency',
    changeLanguageDesc: 'Change the app language to your preference.',
    changeCurrencyDesc: 'Changing the currency will update how all amounts are displayed across the app.',
    english: 'English',
    spanish: 'Spanish',

    // Common
    save: 'Save',
    update: 'Update',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    name: 'Name',
    amount: 'Amount',
    type: 'Type',
    date: 'Date',
    note: 'Note',
    color: 'Color',
    icon: 'Icon',
    none: 'None',
    other: 'Other',

    // Budgets
    addBudget: 'Add Budget',
    editBudget: 'Edit Budget',
    budgetName: 'Budget Name',
    monthlyLimit: 'Monthly Limit',
    associatedCategory: 'Associated Category',
    associatedCategoryOpt: 'Associated Category (Optional)',
    spentOf: 'spent of',
    noBudgets: 'No budgets found. Create one to track your spending limits!',

    // Accounts
    addAccount: 'Add Account',
    editAccount: 'Edit Account',
    accountName: 'Account Name',
    accountType: 'Account Type',
    initialBalance: 'Initial Balance',
    currentBalance: 'Current Balance',
    noAccounts: 'No accounts found.',
    cash: 'Cash',
    bank: 'Bank',
    credit: 'Credit',

    // Categories
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    categoryName: 'Category Name',
    categoryType: 'Category Type',
    income: 'Income',
    expense: 'Expense',
    noCategories: 'No categories found.',

    // Transactions
    addTransaction: 'Add Transaction',
    editTransaction: 'Edit Transaction',
    noTransactions: 'No transactions recorded yet.',
    duplicate: 'Duplicate',
    confirmDelete: 'Are you sure you want to delete this?',
    confirmDeleteTx: 'Are you sure you want to delete this transaction?',
    transactionOptions: 'Transaction Options',
    whatToDo: 'What would you like to do?',
  },
  es: {
    // Tabs
    dashboard: 'Tablero',
    transactions: 'Transacciones',
    accounts: 'Cuentas',
    categories: 'Categorías',
    budgets: 'Presupuestos',
    insights: 'Perspectivas',
    settings: 'Ajustes',
    chartTitle: 'Gastos por Categoría (Este Mes)',

    // Dashboard
    totalBalance: 'Balance Total',
    monthlyIncome: 'Ingresos Mensuales',
    monthlyExpenses: 'Gastos Mensuales',
    recentTransactions: 'Transacciones Recientes',
    noRecentTransactions: 'Sin transacciones recientes',

    // Settings
    preferences: 'Preferencias',
    manageAccounts: 'Gestionar Cuentas',
    manageCategories: 'Gestionar Categorías',
    manageBudgets: 'Gestionar Presupuestos',
    language: 'Idioma',
    currency: 'Moneda',
    changeLanguageDesc: 'Cambia el idioma de la aplicación a tu preferencia.',
    changeCurrencyDesc: 'Cambiar la moneda actualizará cómo se muestran todos los montos en la aplicación.',
    english: 'Inglés',
    spanish: 'Español',

    // Common
    save: 'Guardar',
    update: 'Actualizar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    name: 'Nombre',
    amount: 'Monto',
    type: 'Tipo',
    date: 'Fecha',
    note: 'Nota',
    color: 'Color',
    icon: 'Icono',
    none: 'Ninguno',
    other: 'Otro',

    // Budgets
    addBudget: 'Agregar Presupuesto',
    editBudget: 'Editar Presupuesto',
    budgetName: 'Nombre del Presupuesto',
    monthlyLimit: 'Límite Mensual',
    associatedCategory: 'Categoría Asociada',
    associatedCategoryOpt: 'Categoría Asociada (Opcional)',
    spentOf: 'gastado de',
    noBudgets: 'No se encontraron presupuestos. ¡Crea uno para rastrear tus límites de gastos!',

    // Accounts
    addAccount: 'Agregar Cuenta',
    editAccount: 'Editar Cuenta',
    accountName: 'Nombre de la Cuenta',
    accountType: 'Tipo de Cuenta',
    initialBalance: 'Saldo Inicial',
    currentBalance: 'Saldo Actual',
    noAccounts: 'No se encontraron cuentas.',
    cash: 'Efectivo',
    bank: 'Banco',
    credit: 'Crédito',

    // Categories
    addCategory: 'Agregar Categoría',
    editCategory: 'Editar Categoría',
    categoryName: 'Nombre de la Categoría',
    categoryType: 'Tipo de Categoría',
    income: 'Ingreso',
    expense: 'Gasto',
    noCategories: 'No se encontraron categorías.',

    // Transactions
    addTransaction: 'Agregar Transacción',
    editTransaction: 'Editar Transacción',
    noTransactions: 'Aún no hay transacciones registradas.',
    duplicate: 'Duplicar',
    confirmDelete: '¿Estás seguro de que quieres eliminar esto?',
    confirmDeleteTx: '¿Estás seguro de que deseas eliminar esta transacción?',
    transactionOptions: 'Opciones de Transacción',
    whatToDo: '¿Qué te gustaría hacer?',
  },
};
