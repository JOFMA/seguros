-- CreateTable
CREATE TABLE `Corretora` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Corretora_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `corretoraId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `produto` VARCHAR(191) NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `status` ENUM('NOVO', 'CONTATADO', 'EM_NEGOCIACAO', 'CONVERTIDO', 'PERDIDO') NOT NULL DEFAULT 'NOVO',
    `metaLeadId` VARCHAR(191) NULL,
    `recebidoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `proximaAcao` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `corretoraId` VARCHAR(191) NOT NULL,
    `responsavelId` VARCHAR(191) NULL,

    UNIQUE INDEX `Lead_metaLeadId_key`(`metaLeadId`),
    INDEX `Lead_corretoraId_status_idx`(`corretoraId`, `status`),
    INDEX `Lead_corretoraId_recebidoEm_idx`(`corretoraId`, `recebidoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_corretoraId_fkey` FOREIGN KEY (`corretoraId`) REFERENCES `Corretora`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_corretoraId_fkey` FOREIGN KEY (`corretoraId`) REFERENCES `Corretora`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
