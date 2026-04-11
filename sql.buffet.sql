DROP DATABASE IF EXISTS buffet_db;
CREATE DATABASE buffet_db;
USE buffet_db;


CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'funcionario') DEFAULT 'funcionario'
);


CREATE TABLE cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100)
);


CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tipo VARCHAR(50),
    data DATE,
    local VARCHAR(150),
    convidados INT,
    status ENUM('Planejado', 'Em andamento', 'Finalizado') DEFAULT 'Planejado',

    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
);


CREATE TABLE item_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('comida', 'bebida', 'servico') NOT NULL,
    categoria VARCHAR(50), -- 🔥 usado nos filtros do frontend
    valor DECIMAL(10,2) NOT NULL,
    imagem TEXT            -- 🔥 usada no cardápio
);


CREATE TABLE orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT UNIQUE,
    valor_total DECIMAL(10,2) DEFAULT 0,
    status ENUM('pendente', 'aprovado', 'recusado') DEFAULT 'pendente',

    FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
);


CREATE TABLE item_orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    item_servico_id INT NOT NULL,
    quantidade INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (orcamento_id) REFERENCES orcamento(id) ON DELETE CASCADE,
    FOREIGN KEY (item_servico_id) REFERENCES item_servico(id)
);


CREATE TABLE pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE,
    status ENUM('pendente', 'pago') DEFAULT 'pendente',

    FOREIGN KEY (orcamento_id) REFERENCES orcamento(id) ON DELETE CASCADE
);



-- Usuário
INSERT INTO usuario (email, senha, tipo)
VALUES ('admin@buffet.com', '123456', 'admin');

-- Cliente
INSERT INTO cliente (nome, telefone, email)
VALUES ('Maria Silva', '61999999999', 'maria@email.com');

-- Evento
INSERT INTO evento (cliente_id, tipo, data, local, convidados)
VALUES (1, 'Casamento', '2026-12-20', 'Salão Brasília', 150);


INSERT INTO item_servico (nome, tipo, categoria, valor, imagem)
VALUES 
('Hambúrguer', 'comida', 'principal', 15.00, 'https://i.pinimg.com/736x/c9/c5/01/c9c5013a47c78dde12d22a8659cdb945.jpg'),

('Pizza', 'comida', 'principal', 30.00, 'https://i.pinimg.com/736x/93/50/c0/9350c0f6116de6745968b8d92d26ef4e.jpg'),

('Sushi', 'comida', 'entrada', 40.00, 'https://i.pinimg.com/736x/63/46/10/6346107216394b1136e3243f4bc84efa.jpg'),

('Bolo Pedaço', 'comida', 'sobremesa', 12.00, 'https://i.pinimg.com/736x/fe/50/6b/fe506b764c144d32330995c945a0f364.jpg'),

('Macarrão', 'comida', 'principal', 28.00, 'https://i.pinimg.com/736x/96/4d/fb/964dfbd9d27f85e7b1fc155bccd04bac.jpg');


INSERT INTO orcamento (evento_id)
VALUES (1);

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

-- Pagamento
INSERT INTO pagamento (orcamento_id, valor, data, status)
VALUES (1, 2000.00, '2026-11-01', 'pago');