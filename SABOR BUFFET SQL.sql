-- =========================================
-- BANCO DE DADOS
-- =========================================

CREATE  DATABASE buffet_db;
USE buffet_db;


-- =========================================
-- USUÁRIOS
-- =========================================

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin','funcionario','cliente') DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CLIENTES
-- =========================================

CREATE TABLE cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    usuario_id INT UNIQUE,
    admin_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (admin_id)
        REFERENCES usuario(id)
        ON DELETE SET NULL
);

-- =========================================
-- EVENTOS
-- =========================================

CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cliente_id INT NOT NULL,
    admin_id INT,

    tipo VARCHAR(50) NOT NULL,
    data DATE NOT NULL,
    local VARCHAR(150) NOT NULL,
    convidados INT DEFAULT 0,

    status ENUM(
        'Planejado',
        'Em andamento',
        'Finalizado',
        'Cancelado'
    ) DEFAULT 'Planejado',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE,

    FOREIGN KEY (admin_id)
        REFERENCES usuario(id)
        ON DELETE SET NULL
);

-- =========================================
-- ITENS / SERVIÇOS
-- =========================================

CREATE TABLE item_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,

    tipo ENUM(
        'comida',
        'bebida',
        'servico'
    ) NOT NULL,

    categoria VARCHAR(50),

    valor DECIMAL(10,2) NOT NULL,

    imagem VARCHAR(255)
        DEFAULT 'https://via.placeholder.com/120',

    status ENUM(
        'ativo',
        'inativo'
    ) DEFAULT 'ativo',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP
);
-- =========================================
-- EVENTOS/ ITEN
-- =========================================


CREATE TABLE evento_item (
    id INT AUTO_INCREMENT PRIMARY KEY,

    evento_id INT NOT NULL,
    item_servico_id INT NOT NULL,
    quantidade INT DEFAULT 1,

    FOREIGN KEY (evento_id)
        REFERENCES evento(id)
        ON DELETE CASCADE,

    FOREIGN KEY (item_servico_id)
        REFERENCES item_servico(id)
        ON DELETE CASCADE
);

-- =========================================
-- ORÇAMENTOS
-- =========================================

CREATE TABLE orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,

    evento_id INT NOT NULL,
    admin_id INT,

    valor_total DECIMAL(10,2) DEFAULT 0.00,

    status ENUM(
        'pendente',
        'aprovado',
        'recusado'
    ) DEFAULT 'pendente',

    status_pagamento ENUM(
        'pendente',
        'processando',
        'parcial',
        'pago',
        'cancelado',
        'recusado'
    ) DEFAULT 'pendente',

    observacoes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (evento_id)
        REFERENCES evento(id)
        ON DELETE CASCADE,

    FOREIGN KEY (admin_id)
        REFERENCES usuario(id)
        ON DELETE SET NULL
);

-- =========================================
-- ITENS DO ORÇAMENTO
-- =========================================

CREATE TABLE item_orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,

    orcamento_id INT NOT NULL,
    item_servico_id INT NOT NULL,

    quantidade INT NOT NULL DEFAULT 1,

    valor DECIMAL(10,2) NOT NULL,

    subtotal DECIMAL(10,2)
        GENERATED ALWAYS AS
        (quantidade * valor) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orcamento_id)
        REFERENCES orcamento(id)
        ON DELETE CASCADE,

    FOREIGN KEY (item_servico_id)
        REFERENCES item_servico(id)
        ON DELETE CASCADE
);

--- =========================================
-- PEDIDOS
-- =========================================

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cliente_id INT NOT NULL,
    evento_id INT,
    admin_id INT,

    itens JSON,

    total DECIMAL(10,2),

    status ENUM(
        'Pendente',
        'Confirmado',
        'Finalizado',
        'Cancelado'
    ) DEFAULT 'Pendente',

    metodo_pagamento ENUM(
        'pix',
        'credito',
        'debito'
    ),

    status_pagamento ENUM(
        'pendente',
        'processando',
        'pago',
        'recusado'
    ) DEFAULT 'pendente',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
        ON DELETE CASCADE,

    FOREIGN KEY (evento_id)
        REFERENCES evento(id)
        ON DELETE SET NULL,

    FOREIGN KEY (admin_id)
        REFERENCES usuario(id)
        ON DELETE SET NULL
);
-- =========================================
-- PAGAMENTOS
-- =========================================

CREATE TABLE pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,

    orcamento_id INT NOT NULL,

    metodo_pagamento ENUM(
        'pix',
        'credito',
        'debito'
    ) NOT NULL,

    valor DECIMAL(10,2) NOT NULL,

    parcelas INT DEFAULT 1,

    status ENUM(
        'pendente',
        'processando',
        'pago',
        'recusado',
        'cancelado'
    ) DEFAULT 'pendente',

    transacao_id VARCHAR(120),

    codigo_pix TEXT,

    gateway VARCHAR(50),

    resposta_gateway JSON,

    data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orcamento_id)
        REFERENCES orcamento(id)
        ON DELETE CASCADE
);

-- =========================================
-- USUÁRIOS
-- =========================================

INSERT INTO usuario (nome, email, senha, tipo)
VALUES
('Admin Master', 'admin@email.com', '123', 'admin'),
('João Silva', 'joao@email.com', '123', 'cliente'),
('Maria Santos', 'maria@email.com', '123', 'cliente'),
('Carlos Func', 'carlos@email.com', '123', 'funcionario');

-- =========================================
-- CLIENTES
-- =========================================

INSERT INTO cliente (
    nome,
    telefone,
    email,
    usuario_id,
    admin_id
)
VALUES
('João Silva', '61988888888', 'joao@email.com', 2, 1),
('Maria Santos', '61977777777', 'maria@email.com', 3, 1),
('Ana Paula', '61966666666', 'ana@email.com', NULL, 1);

-- =========================================
-- EVENTOS
-- =========================================

INSERT INTO evento (
    cliente_id,
    admin_id,
    tipo,
    data,
    local,
    convidados,
    status
)
VALUES
(1, 1, 'Casamento', '2026-12-20', 'Salão Brasília', 150, 'Planejado'),
(1, 1, 'Aniversário', '2026-08-15', 'Área Gourmet', 80, 'Planejado'),
(2, 1, 'Formatura', '2026-10-10', 'Salão Principal', 200, 'Em andamento'),
(3, 1, 'Corporativo', '2026-09-05', 'Salão VIP', 50, 'Planejado');

-- =========================================
-- ITENS / SERVIÇOS
-- =========================================

INSERT INTO item_servico (
    nome,
    tipo,
    categoria,
    valor,
    imagem
)
VALUES
(
    'Hambúrguer',
    'comida',
    'principal',
    15.00,
    'https://i.pinimg.com/736x/c9/c5/01/c9c5013a47c78dde12d22a8659cdb945.jpg'
),
(
    'Pizza',
    'comida',
    'principal',
    30.00,
    'https://i.pinimg.com/736x/93/50/c0/9350c0f6116de6745968b8d92d26ef4e.jpg'
),
(
    'Sushi',
    'comida',
    'entrada',
    40.00,
    'https://i.pinimg.com/736x/63/46/10/6346107216394b1136e3243f4bc84efa.jpg'
),
(
    'Bolo Pedaço',
    'comida',
    'sobremesa',
    12.00,
    'https://i.pinimg.com/736x/fe/50/6b/fe506b764c144d32330995c945a0f364.jpg'
),
(
    'Macarrão',
    'comida',
    'principal',
    28.00,
    'https://i.pinimg.com/736x/96/4d/fb/964dfbd9d27f85e7b1fc155bccd04bac.jpg'
);
-- =========================================
-- EVENTOS/ ITEN
-- =========================================

INSERT INTO evento_item (
    evento_id,
    item_servico_id,
    quantidade
)
VALUES
(1, 1, 150),
(1, 2, 150),
(2, 4, 100),
(2, 5, 100),
(3, 3, 200);
-- =========================================
-- ORÇAMENTOS
-- =========================================

INSERT INTO orcamento (
    evento_id,
    admin_id,
    valor_total,
    status,
    status_pagamento
)
VALUES
(1, 1, 6750.00, 'pendente', 'pendente'),
(2, 1, 4000.00, 'aprovado', 'pago'),
(3, 1, 9500.00, 'pendente', 'pendente');

-- =========================================
-- ITENS DOS ORÇAMENTOS
-- =========================================

INSERT INTO item_orcamento (
    orcamento_id,
    item_servico_id,
    quantidade,
    valor
)
VALUES

-- Casamento
(1, 1, 150, 15.00),
(1, 2, 150, 30.00),

-- Aniversário
(2, 4, 100, 12.00),
(2, 5, 100, 28.00),

-- Formatura
(3, 3, 200, 40.00),
(3, 1, 100, 15.00);

-- =========================================
-- PEDIDOS
-- =========================================

INSERT INTO pedidos (
    cliente_id,
    evento_id,
    admin_id,
    itens,
    total,
    status
)
VALUES

(
    1,
    1,
    1,
    JSON_ARRAY(
        JSON_OBJECT('nome','Hambúrguer','qtd',150),
        JSON_OBJECT('nome','Pizza','qtd',150)
    ),
    6750.00,
    'Pendente'
),

(
    2,
    2,
    1,
    JSON_ARRAY(
        JSON_OBJECT('nome','Bolo Pedaço','qtd',100),
        JSON_OBJECT('nome','Macarrão','qtd',100)
    ),
    4000.00,
    'Pendente'
),

(
    3,
    3,
    1,
    JSON_ARRAY(
        JSON_OBJECT('nome','Sushi','qtd',200)
    ),
    8000.00,
    'Finalizado'
);

-- =========================================
-- PAGAMENTOS
-- =========================================

INSERT INTO pagamento (
    orcamento_id,
    metodo_pagamento,
    valor,
    status,
    parcelas
)
VALUES
(1, 'pix', 6750.00, 'pendente', 1),
(2, 'credito', 4000.00, 'pago', 4),
(3, 'pix', 9500.00, 'pendente', 1);

SHOW TABLES;
SELECT * FROM cliente;
USE buffet_db;

SELECT * FROM usuario;
SELECT * FROM cliente;
SELECT * FROM evento;
SELECT * FROM item_servico;
SELECT * FROM orcamento;
SELECT * FROM item_orcamento;
SELECT * FROM pedidos;
SELECT * FROM pagamento;

SELECT
    c.nome,
    p.itens,
    p.total
FROM cliente c
JOIN pedidos p ON c.id = p.cliente_id
WHERE c.id = 1;

