
const STORAGE_KEY = "fintrack.transactions";

// Elementos do formulário
const form = document.querySelector("#transaction-form");
const descriptionInput = document.querySelector("#description");
const amountInput = document.querySelector("#amount");
const typeInput = document.querySelector("#type");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");

// Elementos dos filtros
const filterInput = document.querySelector("#filter-type");
const monthFilterInput = document.querySelector("#filter-month");

// Elementos do histórico e mensagens
const transactionList = document.querySelector("#transaction-list");
const emptyState = document.querySelector("#empty-state");
const formMessage = document.querySelector("#form-message");

// Elementos do resumo financeiro
const balanceElement = document.querySelector("#balance");
const incomeElement = document.querySelector("#total-income");
const expensesElement = document.querySelector("#total-expenses");

// Categorias disponíveis
const categoryLabels = {
    food: "Alimentação",
    housing: "Moradia",
    transport: "Transporte",
    health: "Saúde",
    leisure: "Lazer",
    education: "Educação",
    salary: "Salário",
    investment: "Investimentos",
    other: "Outros"
};

// Formatação de valores monetários
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

// Formatação de datas
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC"
});

// Carrega as movimentações salvas
let transactions = loadTransactions();

// Recupera os dados do navegador
function loadTransactions() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData
            .filter((transaction) => {
                return (
                    transaction &&
                    typeof transaction.id === "string" &&
                    typeof transaction.description === "string" &&
                    transaction.description.trim().length > 0 &&
                    Number.isFinite(transaction.amount) &&
                    transaction.amount > 0 &&
                    ["income", "expense"].includes(transaction.type) &&
                    isValidDate(transaction.date)
                );
            })
            .map((transaction) => ({
                ...transaction,
                category: Object.hasOwn(
                    categoryLabels,
                    transaction.category
                )
                    ? transaction.category
                    : "other"
            }));

    } catch (error) {
        console.error("Não foi possível carregar as movimentações:", error);
        return [];
    }
}

// Salva as movimentações no navegador
function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;

    } catch (error) {
        console.error("Não foi possível salvar as movimentações:", error);

        showMessage(
            "Não foi possível salvar os dados neste navegador.",
            "error"
        );

        return false;
    }
}

// Valida uma data no formato YYYY-MM-DD
function isValidDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

// Retorna a data atual
function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Formata valores monetários
function formatCurrency(value) {
    return currencyFormatter.format(value);
}

// Formata datas
function formatDate(value) {
    const date = new Date(`${value}T00:00:00.000Z`);

    return dateFormatter.format(date);
}

// Exibe mensagens para o usuário
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

// Atualiza os cards do resumo financeiro
function updateSummary() {
    const totalIncome = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const totalExpenses = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const balance = totalIncome - totalExpenses;

    balanceElement.textContent = formatCurrency(balance);
    incomeElement.textContent = formatCurrency(totalIncome);
    expensesElement.textContent = formatCurrency(totalExpenses);
}

// Cria visualmente uma movimentação
function createTransactionElement(transaction) {
    const item = document.createElement("li");
    item.className = "transaction-item";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const description = document.createElement("p");
    description.className = "transaction-description";
    description.textContent = transaction.description;

    const meta = document.createElement("p");
    meta.className = "transaction-meta";

    const typeLabel = transaction.type === "income"
        ? "Receita"
        : "Despesa";

    const categoryLabel =
        categoryLabels[transaction.category] || "Outros";

    meta.textContent =
        `${typeLabel} • ${categoryLabel} • ${formatDate(transaction.date)}`;

    info.append(description, meta);

    const actions = document.createElement("div");
    actions.className = "transaction-actions";

    const amount = document.createElement("span");

    const sign = transaction.type === "income" ? "+" : "−";

    amount.className = transaction.type === "income"
        ? "transaction-amount amount-income"
        : "transaction-amount amount-expense";

    amount.textContent = `${sign} ${formatCurrency(transaction.amount)}`;

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Excluir";

    deleteButton.setAttribute(
        "aria-label",
        `Excluir movimentação: ${transaction.description}`
    );

    deleteButton.dataset.id = transaction.id;

    actions.append(amount, deleteButton);
    item.append(info, actions);

    return item;
}

// Exibe as movimentações aplicando os filtros
function renderTransactions() {
    const selectedType = filterInput.value;
    const selectedMonth = monthFilterInput.value;

    const filteredTransactions = transactions
        .filter((transaction) => {
            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesMonth =
                !selectedMonth ||
                transaction.date.startsWith(selectedMonth);

            return matchesType && matchesMonth;
        })
        .sort((a, b) => {
            const dateComparison = b.date.localeCompare(a.date);

            return dateComparison !== 0
                ? dateComparison
                : b.id.localeCompare(a.id);
        });

    transactionList.replaceChildren();

    for (const transaction of filteredTransactions) {
        transactionList.append(
            createTransactionElement(transaction)
        );
    }

    emptyState.hidden = filteredTransactions.length > 0;

    if (transactions.length === 0) {
        emptyState.textContent =
            "Nenhuma movimentação cadastrada.";

    } else if (filteredTransactions.length === 0) {
        emptyState.textContent =
            "Nenhuma movimentação encontrada com esses filtros.";
    }
}

// Cadastra uma nova movimentação
form.addEventListener("submit", (event) => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description) {
        showMessage("Informe uma descrição.", "error");
        descriptionInput.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Informe um valor maior que zero.", "error");
        amountInput.focus();
        return;
    }

    if (!["income", "expense"].includes(type)) {
        showMessage("Selecione um tipo válido.", "error");
        typeInput.focus();
        return;
    }

    if (!Object.hasOwn(categoryLabels, category)) {
        showMessage("Selecione uma categoria válida.", "error");
        categoryInput.focus();
        return;
    }

    if (!isValidDate(date)) {
        showMessage("Informe uma data válida.", "error");
        dateInput.focus();
        return;
    }

    // Cria o objeto que representa a movimentação
    const transaction = {
        id: crypto.randomUUID(),
        description,
        amount: Math.round(amount * 100) / 100,
        type,
        category,
        date
    };

    transactions.push(transaction);

    // Se não conseguir salvar, desfaz a inclusão
    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    updateSummary();
    renderTransactions();

    form.reset();

    dateInput.value = getToday();
    typeInput.value = "expense";
    categoryInput.value = "other";

    showMessage(
        "Movimentação adicionada com sucesso!",
        "success"
    );

    descriptionInput.focus();
});

// Exclui uma movimentação
transactionList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("button[data-id]");

    if (!deleteButton) {
        return;
    }

    const transactionId = deleteButton.dataset.id;

    const originalTransactions = transactions;

    transactions = transactions.filter(
        (transaction) => transaction.id !== transactionId
    );

    if (transactions.length === originalTransactions.length) {
        return;
    }

    if (!saveTransactions()) {
        transactions = originalTransactions;
        return;
    }

    updateSummary();
    renderTransactions();

    showMessage("Movimentação excluída.", "success");
});

// Filtro por tipo
filterInput.addEventListener("change", renderTransactions);

// Filtro por mês
monthFilterInput.addEventListener("change", renderTransactions);

// Inicialização da aplicação
dateInput.value = getToday();

updateSummary();
renderTransactions();
