-- V30: Create machines table
-- Sewing machine inventory, types, and floor allocations

CREATE TABLE IF NOT EXISTS machines (
    id              BIGSERIAL       PRIMARY KEY,
    machine_code    VARCHAR(50)     NOT NULL,
    machine_type    VARCHAR(100)    NOT NULL,
    brand           VARCHAR(100),
    model           VARCHAR(100),
    serial_no       VARCHAR(100),
    line_id         BIGINT,
    status          VARCHAR(30)     NOT NULL DEFAULT 'AVAILABLE'
                        CHECK (status IN ('AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'IDLE')),
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_machines_code UNIQUE (machine_code),
    CONSTRAINT fk_machines_line FOREIGN KEY (line_id) REFERENCES sewing_lines(id) ON DELETE SET NULL
);

CREATE INDEX idx_machines_type ON machines(machine_type);
CREATE INDEX idx_machines_line ON machines(line_id);
CREATE INDEX idx_machines_status ON machines(status);

-- Seed realistic factory sewing machines
INSERT INTO machines (machine_code, machine_type, brand, model, status, active)
VALUES
('SN-001', 'Single Needle Lockstitch', 'Juki', 'DDL-8700', 'AVAILABLE', true),
('SN-002', 'Single Needle Lockstitch', 'Juki', 'DDL-9000C', 'AVAILABLE', true),
('SN-003', 'Single Needle Lockstitch', 'Brother', 'S-7300A', 'AVAILABLE', true),
('SN-004', 'Single Needle Lockstitch', 'Jack', 'A4F', 'AVAILABLE', true),
('OL-001', '4-Thread Overlock', 'Pegasus', 'M952-52', 'AVAILABLE', true),
('OL-002', '4-Thread Overlock', 'Siruba', '747K', 'AVAILABLE', true),
('OL-003', '5-Thread Overlock', 'Juki', 'MO-6816S', 'AVAILABLE', true),
('FL-001', 'Flatlock / Interlock', 'Yamato', 'VG2700', 'AVAILABLE', true),
('FL-002', 'Flatlock / Interlock', 'Pegasus', 'W562PV', 'AVAILABLE', true),
('BH-001', 'Buttonhole Machine', 'Juki', 'LBH-1790A', 'AVAILABLE', true),
('BA-001', 'Button Attach Machine', 'Juki', 'MB-1377', 'AVAILABLE', true),
('BT-001', 'Bar Tack Machine', 'Brother', 'KE-430FX', 'AVAILABLE', true),
('FOA-001', 'Feed-off-the-arm Machine', 'Juki', 'MS-1261', 'AVAILABLE', true),
('DN-001', 'Double Needle Lockstitch', 'Juki', 'LH-3568A', 'AVAILABLE', true)
ON CONFLICT (machine_code) DO NOTHING;
