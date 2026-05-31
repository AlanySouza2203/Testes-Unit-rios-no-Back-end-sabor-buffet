CREATE DATABASE buffet_db;
USE buffet_db;



-- 🔹 USUÁRIO
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'funcionario', 'cliente') DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 🔹 CLIENTE
CREATE TABLE cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    usuario_id INT NULL UNIQUE,
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

    FOREIGN KEY (admin_id) REFERENCES usuario(id)
);



-- 🔹 EVENTO
CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    admin_id INT,
    tipo VARCHAR(50),
    data DATE,
    local VARCHAR(150),
    convidados INT,
    status ENUM('Planejado', 'Em andamento', 'Finalizado') DEFAULT 'Planejado',

    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES usuario(id)
);


-- 🔹 PEDIDOS
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(100),
    evento_id INT NULL,
    admin_id INT,
    itens JSON,
    total DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Pendente',
    metodo_pagamento ENUM('pix', 'credito', 'debito') NULL,
    status_pagamento ENUM('pendente', 'processando', 'pago', 'recusado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES usuario(id)
);

-- 🔹 ITENS
CREATE TABLE item_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('comida', 'bebida', 'servico') NOT NULL,
    categoria VARCHAR(50),
    valor DECIMAL(10,2) NOT NULL,
    imagem VARCHAR(255) NOT NULL DEFAULT 'https://via.placeholder.com/120',
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);


-- 🔹 ORÇAMENTO
CREATE TABLE orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,

    evento_id INT NOT NULL,

    valor_total DECIMAL(10,2) DEFAULT 0.00,

    status ENUM(
        'pendente',
        'aprovado',
        'recusado'
    ) DEFAULT 'pendente',

    status_pagamento ENUM(
        'pendente',
        'processando',
        'pago',
        'parcial',
        'cancelado',
        'recusado'
    ) DEFAULT 'pendente',

    observacoes TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT NULL
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (evento_id)
    REFERENCES evento(id)
    ON DELETE CASCADE
);



-- 🔹 ITEM ORÇAMENTO
CREATE TABLE item_orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,

    orcamento_id INT NOT NULL,

    item_servico_id INT NOT NULL,

    quantidade INT NOT NULL DEFAULT 1,

    valor DECIMAL(10,2) NOT NULL,

    subtotal DECIMAL(10,2)
    GENERATED ALWAYS AS (quantidade * valor) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orcamento_id)
    REFERENCES orcamento(id)
    ON DELETE CASCADE,

    FOREIGN KEY (item_servico_id)
    REFERENCES item_servico(id)
    ON DELETE CASCADE
);


-- 🔹 PAGAMENTO
CREATE TABLE pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    metodo_pagamento ENUM('pix', 'credito', 'debito') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('pendente', 'processando', 'pago', 'recusado', 'cancelado') DEFAULT 'pendente',
    transacao_id VARCHAR(120),
    codigo_pix TEXT,
    parcelas INT DEFAULT 1,
    data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    gateway VARCHAR(50),
    resposta_gateway JSON,

    FOREIGN KEY (orcamento_id) REFERENCES orcamento(id) ON DELETE CASCADE
);



INSERT INTO usuario (nome, email, senha, tipo) VALUES 
('Admin Master', 'admin@email.com', '123', 'admin'),
('João Silva', 'joao@email.com', '123', 'cliente'),
('Maria Santos', 'maria@email.com', '123', 'cliente'),
('Carlos Func', 'carlos@email.com', '123', 'funcionario');
-- 🔥 CLIENTE COM ADMIN
INSERT INTO cliente (nome, telefone, email, usuario_id, admin_id) VALUES 
('João Silva', '61988888888', 'joao@email.com', 2, 1),
('Maria Santos', '61977777777', 'maria@email.com', 3, 1),
('Ana Paula', '61966666666', 'ana@email.com', NULL, 1);  -- Cliente sem usuário

-- 🔥 EVENTO COM ADMIN
INSERT INTO evento (cliente_id, admin_id, tipo, data, local, convidados, status) VALUES 
(1, 1, 'Casamento', '2026-12-20', 'Salão Brasília', 150, 'Planejado'),
(1, 1, 'Aniversário', '2026-08-15', 'Área Gourmet', 80, 'Planejado'),
(2, 1, 'Formatura', '2026-10-10', 'Salão Principal', 200, 'Em andamento'),
(3, 1, 'Corporativo', '2026-09-05', 'Salão VIP', 50, 'Planejado');

INSERT INTO item_servico (nome, tipo, categoria, valor, imagem)
VALUES 
('Hambúrguer', 'comida', 'principal', 15.00, 'https://i.pinimg.com/736x/c9/c5/01/c9c5013a47c78dde12d22a8659cdb945.jpg'),

('Pizza', 'comida', 'principal', 30.00, 'https://i.pinimg.com/736x/93/50/c0/9350c0f6116de6745968b8d92d26ef4e.jpg'),

('Sushi', 'comida', 'entrada', 40.00, 'https://i.pinimg.com/736x/63/46/10/6346107216394b1136e3243f4bc84efa.jpg'),

('Bolo Pedaço', 'comida', 'sobremesa', 12.00, 'https://i.pinimg.com/736x/fe/50/6b/fe506b764c144d32330995c945a0f364.jpg'),

('Macarrão', 'comida', 'principal', 28.00, 'https://i.pinimg.com/736x/96/4d/fb/964dfbd9d27f85e7b1fc155bccd04bac.jpg');

-- 🔥 PEDIDO COM ADMIN (EXEMPLO)
INSERT INTO pedidos (cliente, evento_id, admin_id, itens, total, status) VALUES 
('João Silva', 1, 1, JSON_ARRAY(
    JSON_OBJECT('nome','Hambúrguer','qtd',50),
    JSON_OBJECT('nome','Pizza','qtd',30)
), 1650.00, 'Pendente'),

('Maria Santos', 2, 1, JSON_ARRAY(
    JSON_OBJECT('nome','Sushi','qtd',80),
    JSON_OBJECT('nome','Bolo Pedaço','qtd',80)
), 4160.00, 'Pendente'),

('Ana Paula', 3, 1, JSON_ARRAY(
    JSON_OBJECT('nome','Macarrão','qtd',100)
), 2800.00, 'Finalizado');

-- 🔥 ORÇAMENTO
INSERT INTO orcamento (evento_id, admin_id, valor_total, status, status_pagamento)
VALUES (1, 1, 0.00, 'pendente', 'pendente');

INSERT INTO item_orcamento (orcamento_id, item_servico_id, quantidade, valor)
VALUES
(1, 1, 150, 15.00),
(1, 2, 150, 30.00);

UPDATE orcamento
SET valor_total = (
    SELECT SUM(quantidade * valor)
    FROM item_orcamento
    WHERE orcamento_id = 1
)
WHERE id = 1;
-- 🔥 PAGAMENTO
INSERT INTO pagamento (orcamento_id, metodo_pagamento, valor, status)
VALUES (1, 'pix', 2000.00, 'pendente');

-- Pagamento
INSERT INTO pagamento (
    orcamento_id,
    metodo_pagamento,
    valor,
    status,
    parcelas
)
VALUES (
    1,
    'pix',
    2000.00,
    'pendente',
    1
);

-- 5. Inserir ORÇAMENTOS (aqui estava o problema!)
INSERT INTO orcamento (id, evento_id, valor_total, status, status_pagamento) VALUES 
(1, 1, 6750.00, 'pendente', 'pendente'),
(2, 2, 3200.00, 'aprovado', 'pago'),
(3, 3, 8400.00, 'pendente', 'pendente');

-- 6. Inserir ITENS dos orçamentos
INSERT INTO item_orcamento (orcamento_id, item_servico_id, quantidade, valor) VALUES 
-- Orçamento 1 (Casamento - R$ 6.750)
(1, 1, 150, 15.00),   -- 150 hambúrgueres = R$ 2.250
(1, 2, 150, 30.00),   -- 150 pizzas = R$ 4.500
-- Orçamento 2 (Aniversário - R$ 3.200)
(2, 4, 100, 12.00),   -- 100 bolos = R$ 1.200
(2, 5, 100, 28.00),   -- 100 macarrão = R$ 2.800
-- Orçamento 3 (Formatura - R$ 8.400)
(3, 3, 200, 40.00),   -- 200 sushis = R$ 8.000
(3, 1, 100, 15.00);   -- 100 hambúrgueres = R$ 1.500

-- 1. Verificar se existem eventos e clientes
SELECT id, cliente_id FROM evento;
SELECT id, nome FROM cliente;

-- 2. Inserir ORÇAMENTOS (substitua os IDs pelos que existirem)
INSERT INTO orcamento (evento_id, valor_total, status, status_pagamento) VALUES 
(1, 6750.00, 'pendente', 'pendente'),
(1, 8500.00, 'aprovado', 'pago'),
(2, 3200.00, 'pendente', 'pendente');

-- 3. Inserir ITENS dos orçamentos
INSERT INTO item_orcamento (orcamento_id, item_servico_id, quantidade, valor) VALUES 
-- Orçamento 1
(1, 1, 150, 15.00),   -- 150 hambúrgueres
(1, 2, 100, 30.00),   -- 100 pizzas
-- Orçamento 2  
(2, 3, 200, 40.00),   -- 200 sushis
(2, 4, 150, 12.00),   -- 150 bolos
-- Orçamento 3
(3, 5, 80, 28.00);    -- 80 macarrões

-- 4. Verificar se foi inserido
SELECT COUNT(*) as total_orcamentos FROM orcamento;
SELECT * FROM orcamento;
-- 7. Verificar se tudo foi inserido
SELECT COUNT(*) as total_orcamentos FROM orcamento;
SELECT COUNT(*) as total_itens_orcamento FROM item_orcamento;

-- 8. Ver query que seu backend usa (deve retornar 3 linhas)
SELECT
    o.*,
    e.tipo,
    e.data,
    c.nome AS cliente
FROM orcamento o
JOIN evento e ON e.id = o.evento_id
JOIN cliente c ON c.id = e.cliente_id
ORDER BY o.id DESC;

UPDATE pedidos 
SET evento_id = 1 
WHERE evento_id IS NULL;


ALTER TABLE orcamento
ADD COLUMN admin_id INT,
ADD CONSTRAINT fk_orcamento_admin
FOREIGN KEY (admin_id) REFERENCES usuario(id);


ALTER TABLE orcamento
ADD COLUMN admin_id INT;

ALTER TABLE orcamento
ADD CONSTRAINT fk_orcamento_admin
FOREIGN KEY (admin_id) REFERENCES usuario(id);


















