--
-- PostgreSQL database dump
--

\restrict Yig3noEUzlXSsZIpqxJ3CZeqhoxWpzvfLvGCwzMEJccYCEy2guXUDxWzGz4kW5u

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.skill_matrix_history DROP CONSTRAINT IF EXISTS skill_matrix_history_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_matrix_history DROP CONSTRAINT IF EXISTS skill_matrix_history_operation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.optimization_recommendations DROP CONSTRAINT IF EXISTS optimization_recommendations_line_design_id_fkey;
ALTER TABLE IF EXISTS ONLY public.optimization_recommendations DROP CONSTRAINT IF EXISTS optimization_recommendations_balance_workstation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operator_station_placements DROP CONSTRAINT IF EXISTS operator_station_placements_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operator_station_placements DROP CONSTRAINT IF EXISTS operator_station_placements_line_design_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operator_station_placements DROP CONSTRAINT IF EXISTS operator_station_placements_balance_workstation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operator_performance_logs DROP CONSTRAINT IF EXISTS operator_performance_logs_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operator_performance_logs DROP CONSTRAINT IF EXISTS operator_performance_logs_operation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operator_attachments DROP CONSTRAINT IF EXISTS operator_attachments_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operation_bulletins DROP CONSTRAINT IF EXISTS operation_bulletins_parent_bulletin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operation_affinities DROP CONSTRAINT IF EXISTS operation_affinities_primary_operation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operation_affinities DROP CONSTRAINT IF EXISTS operation_affinities_alternative_operation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_shift_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_plans DROP CONSTRAINT IF EXISTS line_plans_line_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_shift_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_line_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_capacity_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_bulletin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.line_design_machines DROP CONSTRAINT IF EXISTS line_design_machines_line_design_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_assessments DROP CONSTRAINT IF EXISTS fk_skill_operator;
ALTER TABLE IF EXISTS ONLY public.skill_assessments DROP CONSTRAINT IF EXISTS fk_skill_operation;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS fk_sa_shift;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS fk_sa_operator;
ALTER TABLE IF EXISTS ONLY public.piece_production_logs DROP CONSTRAINT IF EXISTS fk_ppl_order;
ALTER TABLE IF EXISTS ONLY public.piece_production_logs DROP CONSTRAINT IF EXISTS fk_ppl_operator;
ALTER TABLE IF EXISTS ONLY public.piece_production_logs DROP CONSTRAINT IF EXISTS fk_ppl_operation;
ALTER TABLE IF EXISTS ONLY public.order_size_lines DROP CONSTRAINT IF EXISTS fk_osl_size;
ALTER TABLE IF EXISTS ONLY public.order_size_lines DROP CONSTRAINT IF EXISTS fk_osl_order;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS fk_orders_style;
ALTER TABLE IF EXISTS ONLY public.machines DROP CONSTRAINT IF EXISTS fk_machines_line;
ALTER TABLE IF EXISTS ONLY public.line_plans DROP CONSTRAINT IF EXISTS fk_line_plan_shift;
ALTER TABLE IF EXISTS ONLY public.line_plans DROP CONSTRAINT IF EXISTS fk_line_plan_order;
ALTER TABLE IF EXISTS ONLY public.hourly_production_entries DROP CONSTRAINT IF EXISTS fk_hpe_operator;
ALTER TABLE IF EXISTS ONLY public.hourly_production_entries DROP CONSTRAINT IF EXISTS fk_hpe_operation;
ALTER TABLE IF EXISTS ONLY public.hourly_production_entries DROP CONSTRAINT IF EXISTS fk_hpe_line_plan;
ALTER TABLE IF EXISTS ONLY public.bulletin_styles DROP CONSTRAINT IF EXISTS fk_bs_style;
ALTER TABLE IF EXISTS ONLY public.bulletin_styles DROP CONSTRAINT IF EXISTS fk_bs_bulletin;
ALTER TABLE IF EXISTS ONLY public.bulletin_lines DROP CONSTRAINT IF EXISTS fk_bl_operation;
ALTER TABLE IF EXISTS ONLY public.bulletin_lines DROP CONSTRAINT IF EXISTS fk_bl_bulletin;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS fk_att_shift;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS fk_att_operator;
ALTER TABLE IF EXISTS ONLY public.line_plan_assignments DROP CONSTRAINT IF EXISTS fk_assignment_plan;
ALTER TABLE IF EXISTS ONLY public.line_plan_assignments DROP CONSTRAINT IF EXISTS fk_assignment_operator;
ALTER TABLE IF EXISTS ONLY public.line_plan_assignments DROP CONSTRAINT IF EXISTS fk_assignment_operation;
ALTER TABLE IF EXISTS ONLY public.line_plan_assignments DROP CONSTRAINT IF EXISTS fk_assignment_bulletin_line;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_feedback DROP CONSTRAINT IF EXISTS chat_feedback_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.capacity_plans DROP CONSTRAINT IF EXISTS capacity_plans_style_id_fkey;
ALTER TABLE IF EXISTS ONLY public.capacity_plans DROP CONSTRAINT IF EXISTS capacity_plans_shift_id_fkey;
ALTER TABLE IF EXISTS ONLY public.capacity_plans DROP CONSTRAINT IF EXISTS capacity_plans_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.capacity_plans DROP CONSTRAINT IF EXISTS capacity_plans_bulletin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balance_workstations DROP CONSTRAINT IF EXISTS balance_workstations_line_design_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balance_station_operations DROP CONSTRAINT IF EXISTS balance_station_operations_operation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balance_station_operations DROP CONSTRAINT IF EXISTS balance_station_operations_bulletin_line_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balance_station_operations DROP CONSTRAINT IF EXISTS balance_station_operations_balance_workstation_id_fkey;
DROP INDEX IF EXISTS public.uq_skill_current;
DROP INDEX IF EXISTS public.idx_styles_buyer;
DROP INDEX IF EXISTS public.idx_styles_active;
DROP INDEX IF EXISTS public.idx_skill_operator_id;
DROP INDEX IF EXISTS public.idx_skill_operation_id;
DROP INDEX IF EXISTS public.idx_skill_is_current;
DROP INDEX IF EXISTS public.idx_skill_history_operator;
DROP INDEX IF EXISTS public.idx_skill_history_operation;
DROP INDEX IF EXISTS public.idx_skill_history_date;
DROP INDEX IF EXISTS public.idx_sizes_sequence;
DROP INDEX IF EXISTS public.idx_sizes_active;
DROP INDEX IF EXISTS public.idx_shifts_active;
DROP INDEX IF EXISTS public.idx_sewing_lines_active;
DROP INDEX IF EXISTS public.idx_sa_status;
DROP INDEX IF EXISTS public.idx_sa_shift_id;
DROP INDEX IF EXISTS public.idx_sa_operator_id;
DROP INDEX IF EXISTS public.idx_sa_operator_active;
DROP INDEX IF EXISTS public.idx_ppl_operator_date;
DROP INDEX IF EXISTS public.idx_ppl_log_date;
DROP INDEX IF EXISTS public.idx_ppl_hour_slot;
DROP INDEX IF EXISTS public.idx_perf_logs_operator;
DROP INDEX IF EXISTS public.idx_perf_logs_operation;
DROP INDEX IF EXISTS public.idx_perf_logs_date;
DROP INDEX IF EXISTS public.idx_osp_operator_id;
DROP INDEX IF EXISTS public.idx_osp_design_id;
DROP INDEX IF EXISTS public.idx_osl_order_id;
DROP INDEX IF EXISTS public.idx_orders_style;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_buyer;
DROP INDEX IF EXISTS public.idx_opt_rec_design_id;
DROP INDEX IF EXISTS public.idx_operators_name;
DROP INDEX IF EXISTS public.idx_operators_department;
DROP INDEX IF EXISTS public.idx_operators_active;
DROP INDEX IF EXISTS public.idx_operations_sequence;
DROP INDEX IF EXISTS public.idx_operations_active;
DROP INDEX IF EXISTS public.idx_op_affinities_primary;
DROP INDEX IF EXISTS public.idx_op_affinities_alt;
DROP INDEX IF EXISTS public.idx_notif_type;
DROP INDEX IF EXISTS public.idx_notif_operator_id;
DROP INDEX IF EXISTS public.idx_notif_is_read;
DROP INDEX IF EXISTS public.idx_notif_created_at;
DROP INDEX IF EXISTS public.idx_machines_type;
DROP INDEX IF EXISTS public.idx_machines_status;
DROP INDEX IF EXISTS public.idx_machines_line;
DROP INDEX IF EXISTS public.idx_line_plan_order_id;
DROP INDEX IF EXISTS public.idx_line_plan_assignment_plan_id;
DROP INDEX IF EXISTS public.idx_line_designs_status;
DROP INDEX IF EXISTS public.idx_line_designs_order_id;
DROP INDEX IF EXISTS public.idx_line_designs_line_id;
DROP INDEX IF EXISTS public.idx_ldm_design_id;
DROP INDEX IF EXISTS public.idx_hpe_operator_date;
DROP INDEX IF EXISTS public.idx_hpe_operation_date;
DROP INDEX IF EXISTS public.idx_hpe_line_plan_date;
DROP INDEX IF EXISTS public.idx_chat_msg_created;
DROP INDEX IF EXISTS public.idx_chat_msg_conv;
DROP INDEX IF EXISTS public.idx_chat_feedback_msg;
DROP INDEX IF EXISTS public.idx_chat_conv_user;
DROP INDEX IF EXISTS public.idx_chat_conv_updated;
DROP INDEX IF EXISTS public.idx_capacity_plans_order_id;
DROP INDEX IF EXISTS public.idx_capacity_plans_bulletin_id;
DROP INDEX IF EXISTS public.idx_bw_design_id;
DROP INDEX IF EXISTS public.idx_bulletins_status;
DROP INDEX IF EXISTS public.idx_bso_station_id;
DROP INDEX IF EXISTS public.idx_bs_style_id;
DROP INDEX IF EXISTS public.idx_bl_sequence;
DROP INDEX IF EXISTS public.idx_bl_bulletin_id;
DROP INDEX IF EXISTS public.idx_att_status;
DROP INDEX IF EXISTS public.idx_att_shift;
DROP INDEX IF EXISTS public.idx_att_operator;
DROP INDEX IF EXISTS public.idx_att_date;
DROP INDEX IF EXISTS public.idx_activity_logs_timestamp;
DROP INDEX IF EXISTS public.idx_activity_logs_entity;
DROP INDEX IF EXISTS public.flyway_schema_history_s_idx;
ALTER TABLE IF EXISTS ONLY public.styles DROP CONSTRAINT IF EXISTS uq_styles_style_no;
ALTER TABLE IF EXISTS ONLY public.sizes DROP CONSTRAINT IF EXISTS uq_sizes_code;
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS uq_shifts_code;
ALTER TABLE IF EXISTS ONLY public.sewing_lines DROP CONSTRAINT IF EXISTS uq_sewing_lines_code;
ALTER TABLE IF EXISTS ONLY public.order_size_lines DROP CONSTRAINT IF EXISTS uq_osl_order_size;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS uq_orders_order_no;
ALTER TABLE IF EXISTS ONLY public.operators DROP CONSTRAINT IF EXISTS uq_operators_employee_id;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS uq_operations_name;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS uq_operations_code;
ALTER TABLE IF EXISTS ONLY public.machines DROP CONSTRAINT IF EXISTS uq_machines_code;
ALTER TABLE IF EXISTS ONLY public.hourly_production_entries DROP CONSTRAINT IF EXISTS uq_hpe_key;
ALTER TABLE IF EXISTS ONLY public.balance_workstations DROP CONSTRAINT IF EXISTS uq_bw_design_station;
ALTER TABLE IF EXISTS ONLY public.operation_bulletins DROP CONSTRAINT IF EXISTS uq_bulletins_code_version;
ALTER TABLE IF EXISTS ONLY public.bulletin_lines DROP CONSTRAINT IF EXISTS uq_bl_bulletin_seq;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS uq_att_unique;
ALTER TABLE IF EXISTS ONLY public.operation_affinities DROP CONSTRAINT IF EXISTS uk_primary_alt_operation;
ALTER TABLE IF EXISTS ONLY public.styles DROP CONSTRAINT IF EXISTS styles_pkey;
ALTER TABLE IF EXISTS ONLY public.skill_matrix_history DROP CONSTRAINT IF EXISTS skill_matrix_history_pkey;
ALTER TABLE IF EXISTS ONLY public.skill_assessments DROP CONSTRAINT IF EXISTS skill_assessments_pkey;
ALTER TABLE IF EXISTS ONLY public.sizes DROP CONSTRAINT IF EXISTS sizes_pkey;
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS shifts_pkey;
ALTER TABLE IF EXISTS ONLY public.shift_assignments DROP CONSTRAINT IF EXISTS shift_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.sewing_lines DROP CONSTRAINT IF EXISTS sewing_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.piece_production_logs DROP CONSTRAINT IF EXISTS piece_production_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_size_lines DROP CONSTRAINT IF EXISTS order_size_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.optimization_recommendations DROP CONSTRAINT IF EXISTS optimization_recommendations_pkey;
ALTER TABLE IF EXISTS ONLY public.operators DROP CONSTRAINT IF EXISTS operators_pkey;
ALTER TABLE IF EXISTS ONLY public.operator_station_placements DROP CONSTRAINT IF EXISTS operator_station_placements_pkey;
ALTER TABLE IF EXISTS ONLY public.operator_performance_logs DROP CONSTRAINT IF EXISTS operator_performance_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.operator_attachments DROP CONSTRAINT IF EXISTS operator_attachments_pkey;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS operations_pkey;
ALTER TABLE IF EXISTS ONLY public.operation_bulletins DROP CONSTRAINT IF EXISTS operation_bulletins_pkey;
ALTER TABLE IF EXISTS ONLY public.operation_affinities DROP CONSTRAINT IF EXISTS operation_affinities_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.machines DROP CONSTRAINT IF EXISTS machines_pkey;
ALTER TABLE IF EXISTS ONLY public.line_plans DROP CONSTRAINT IF EXISTS line_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.line_plan_assignments DROP CONSTRAINT IF EXISTS line_plan_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_pkey;
ALTER TABLE IF EXISTS ONLY public.line_designs DROP CONSTRAINT IF EXISTS line_designs_design_code_key;
ALTER TABLE IF EXISTS ONLY public.line_design_machines DROP CONSTRAINT IF EXISTS line_design_machines_pkey;
ALTER TABLE IF EXISTS ONLY public.hourly_production_entries DROP CONSTRAINT IF EXISTS hourly_production_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.flyway_schema_history DROP CONSTRAINT IF EXISTS flyway_schema_history_pk;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_feedback DROP CONSTRAINT IF EXISTS chat_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.capacity_plans DROP CONSTRAINT IF EXISTS capacity_plans_plan_code_key;
ALTER TABLE IF EXISTS ONLY public.capacity_plans DROP CONSTRAINT IF EXISTS capacity_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.bulletin_styles DROP CONSTRAINT IF EXISTS bulletin_styles_pkey;
ALTER TABLE IF EXISTS ONLY public.bulletin_lines DROP CONSTRAINT IF EXISTS bulletin_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.balance_workstations DROP CONSTRAINT IF EXISTS balance_workstations_pkey;
ALTER TABLE IF EXISTS ONLY public.balance_station_operations DROP CONSTRAINT IF EXISTS balance_station_operations_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
ALTER TABLE IF EXISTS public.styles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.skill_matrix_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.skill_assessments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sizes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.shifts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.shift_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sewing_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.piece_production_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_size_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.optimization_recommendations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operators ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operator_station_placements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operator_performance_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operator_attachments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operation_bulletins ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operation_affinities ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.machines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.line_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.line_plan_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.line_designs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.line_design_machines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hourly_production_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_feedback ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_conversations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.capacity_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bulletin_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.balance_workstations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.balance_station_operations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.attendance_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.activity_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.styles_id_seq;
DROP TABLE IF EXISTS public.styles;
DROP SEQUENCE IF EXISTS public.skill_matrix_history_id_seq;
DROP TABLE IF EXISTS public.skill_matrix_history;
DROP SEQUENCE IF EXISTS public.skill_assessments_id_seq;
DROP TABLE IF EXISTS public.skill_assessments;
DROP SEQUENCE IF EXISTS public.sizes_id_seq;
DROP TABLE IF EXISTS public.sizes;
DROP SEQUENCE IF EXISTS public.shifts_id_seq;
DROP TABLE IF EXISTS public.shifts;
DROP SEQUENCE IF EXISTS public.shift_assignments_id_seq;
DROP TABLE IF EXISTS public.shift_assignments;
DROP SEQUENCE IF EXISTS public.sewing_lines_id_seq;
DROP TABLE IF EXISTS public.sewing_lines;
DROP SEQUENCE IF EXISTS public.piece_production_logs_id_seq;
DROP TABLE IF EXISTS public.piece_production_logs;
DROP SEQUENCE IF EXISTS public.orders_id_seq;
DROP TABLE IF EXISTS public.orders;
DROP SEQUENCE IF EXISTS public.order_size_lines_id_seq;
DROP TABLE IF EXISTS public.order_size_lines;
DROP SEQUENCE IF EXISTS public.optimization_recommendations_id_seq;
DROP TABLE IF EXISTS public.optimization_recommendations;
DROP SEQUENCE IF EXISTS public.operators_id_seq;
DROP TABLE IF EXISTS public.operators;
DROP SEQUENCE IF EXISTS public.operator_station_placements_id_seq;
DROP TABLE IF EXISTS public.operator_station_placements;
DROP SEQUENCE IF EXISTS public.operator_performance_logs_id_seq;
DROP TABLE IF EXISTS public.operator_performance_logs;
DROP SEQUENCE IF EXISTS public.operator_attachments_id_seq;
DROP TABLE IF EXISTS public.operator_attachments;
DROP SEQUENCE IF EXISTS public.operations_id_seq;
DROP TABLE IF EXISTS public.operations;
DROP SEQUENCE IF EXISTS public.operation_bulletins_id_seq;
DROP TABLE IF EXISTS public.operation_bulletins;
DROP SEQUENCE IF EXISTS public.operation_affinities_id_seq;
DROP TABLE IF EXISTS public.operation_affinities;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.machines_id_seq;
DROP TABLE IF EXISTS public.machines;
DROP SEQUENCE IF EXISTS public.line_plans_id_seq;
DROP TABLE IF EXISTS public.line_plans;
DROP SEQUENCE IF EXISTS public.line_plan_assignments_id_seq;
DROP TABLE IF EXISTS public.line_plan_assignments;
DROP SEQUENCE IF EXISTS public.line_designs_id_seq;
DROP TABLE IF EXISTS public.line_designs;
DROP SEQUENCE IF EXISTS public.line_design_machines_id_seq;
DROP TABLE IF EXISTS public.line_design_machines;
DROP SEQUENCE IF EXISTS public.hourly_production_entries_id_seq;
DROP TABLE IF EXISTS public.hourly_production_entries;
DROP TABLE IF EXISTS public.flyway_schema_history;
DROP SEQUENCE IF EXISTS public.chat_messages_id_seq;
DROP TABLE IF EXISTS public.chat_messages;
DROP SEQUENCE IF EXISTS public.chat_feedback_id_seq;
DROP TABLE IF EXISTS public.chat_feedback;
DROP SEQUENCE IF EXISTS public.chat_conversations_id_seq;
DROP TABLE IF EXISTS public.chat_conversations;
DROP SEQUENCE IF EXISTS public.capacity_plans_id_seq;
DROP TABLE IF EXISTS public.capacity_plans;
DROP TABLE IF EXISTS public.bulletin_styles;
DROP SEQUENCE IF EXISTS public.bulletin_lines_id_seq;
DROP TABLE IF EXISTS public.bulletin_lines;
DROP SEQUENCE IF EXISTS public.balance_workstations_id_seq;
DROP TABLE IF EXISTS public.balance_workstations;
DROP SEQUENCE IF EXISTS public.balance_station_operations_id_seq;
DROP TABLE IF EXISTS public.balance_station_operations;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.attendance_records_id_seq;
DROP TABLE IF EXISTS public.attendance_records;
DROP SEQUENCE IF EXISTS public.activity_logs_id_seq;
DROP TABLE IF EXISTS public.activity_logs;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id bigint NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    action character varying(100) NOT NULL,
    details text,
    user_name character varying(100) DEFAULT 'System'::character varying NOT NULL,
    log_type character varying(50) DEFAULT 'default'::character varying NOT NULL,
    is_secure boolean DEFAULT false NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: TABLE activity_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.activity_logs IS 'Audit trail for all major application entities.';


--
-- Name: COLUMN activity_logs.entity_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.entity_type IS 'e.g., OPERATOR, SHIFT, OPERATION';


--
-- Name: COLUMN activity_logs.entity_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.entity_id IS 'ID of the related entity';


--
-- Name: COLUMN activity_logs.log_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.log_type IS 'e.g., default, attachment, attendance';


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    id bigint NOT NULL,
    attendance_date date NOT NULL,
    operator_id bigint NOT NULL,
    shift_id bigint NOT NULL,
    status character varying(20) NOT NULL,
    check_in_time time without time zone,
    check_out_time time without time zone,
    remarks text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_records_status_check CHECK (((status)::text = ANY ((ARRAY['PRESENT'::character varying, 'ABSENT'::character varying, 'LATE'::character varying, 'HALF_DAY'::character varying, 'ON_LEAVE'::character varying, 'NOT_REPORTED'::character varying])::text[])))
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- Name: TABLE attendance_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.attendance_records IS 'Daily attendance tracking. One record per operator per shift per date.';


--
-- Name: COLUMN attendance_records.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendance_records.status IS 'PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, NOT_REPORTED.';


--
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_records_id_seq OWNER TO postgres;

--
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    entity_name character varying(255) NOT NULL,
    entity_id character varying(255) NOT NULL,
    action character varying(50) NOT NULL,
    performed_by character varying(255) NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    details character varying(500)
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: balance_station_operations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_station_operations (
    id bigint NOT NULL,
    balance_workstation_id bigint NOT NULL,
    operation_id bigint NOT NULL,
    bulletin_line_id bigint,
    sequence integer DEFAULT 1 NOT NULL,
    operation_smv double precision DEFAULT 0.0 NOT NULL,
    machine_type character varying(100),
    is_split boolean DEFAULT false NOT NULL,
    split_ratio double precision DEFAULT 1.0 NOT NULL,
    is_qc_checkpoint boolean DEFAULT false NOT NULL
);


ALTER TABLE public.balance_station_operations OWNER TO postgres;

--
-- Name: balance_station_operations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.balance_station_operations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.balance_station_operations_id_seq OWNER TO postgres;

--
-- Name: balance_station_operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.balance_station_operations_id_seq OWNED BY public.balance_station_operations.id;


--
-- Name: balance_workstations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_workstations (
    id bigint NOT NULL,
    line_design_id bigint NOT NULL,
    station_index integer NOT NULL,
    station_code character varying(20) NOT NULL,
    primary_machine_type character varying(100),
    allocated_operators integer DEFAULT 1 NOT NULL,
    effective_time_secs double precision DEFAULT 0.0 NOT NULL,
    capacity_per_hour double precision DEFAULT 0.0 NOT NULL,
    workload_percent double precision DEFAULT 0.0 NOT NULL,
    is_bottleneck boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.balance_workstations OWNER TO postgres;

--
-- Name: balance_workstations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.balance_workstations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.balance_workstations_id_seq OWNER TO postgres;

--
-- Name: balance_workstations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.balance_workstations_id_seq OWNED BY public.balance_workstations.id;


--
-- Name: bulletin_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bulletin_lines (
    id bigint NOT NULL,
    bulletin_id bigint NOT NULL,
    sequence integer NOT NULL,
    operation_id bigint NOT NULL,
    smv numeric(10,4) NOT NULL,
    machine_type character varying(100),
    skill_rating_required integer,
    notes text,
    is_qc_checkpoint boolean DEFAULT false NOT NULL,
    section character varying(50) DEFAULT 'MAIN_ASSEMBLY'::character varying,
    predecessor_ids character varying(255),
    is_parallelizable boolean DEFAULT true,
    split_allowed boolean DEFAULT false,
    split_type character varying(50) DEFAULT 'NONE'::character varying,
    stitch_type character varying(100),
    seam_type character varying(100),
    attachment_type character varying(100),
    wip_threshold integer DEFAULT 20,
    CONSTRAINT bulletin_lines_skill_rating_required_check CHECK (((skill_rating_required >= 1) AND (skill_rating_required <= 5))),
    CONSTRAINT bulletin_lines_smv_check CHECK ((smv >= (0)::numeric))
);


ALTER TABLE public.bulletin_lines OWNER TO postgres;

--
-- Name: TABLE bulletin_lines; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bulletin_lines IS 'Individual operation lines within an Operation Bulletin.';


--
-- Name: COLUMN bulletin_lines.smv; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bulletin_lines.smv IS 'Standard Minute Value for this operation in this bulletin.';


--
-- Name: COLUMN bulletin_lines.skill_rating_required; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bulletin_lines.skill_rating_required IS 'Minimum skill rating (1-5) needed to perform this operation.';


--
-- Name: bulletin_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bulletin_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bulletin_lines_id_seq OWNER TO postgres;

--
-- Name: bulletin_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bulletin_lines_id_seq OWNED BY public.bulletin_lines.id;


--
-- Name: bulletin_styles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bulletin_styles (
    bulletin_id bigint NOT NULL,
    style_id bigint NOT NULL
);


ALTER TABLE public.bulletin_styles OWNER TO postgres;

--
-- Name: TABLE bulletin_styles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bulletin_styles IS 'Many-to-many: one bulletin can be attached to multiple styles.';


--
-- Name: capacity_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capacity_plans (
    id bigint NOT NULL,
    plan_code character varying(50) NOT NULL,
    order_id bigint NOT NULL,
    style_id bigint,
    bulletin_id bigint,
    shift_id bigint,
    order_quantity integer NOT NULL,
    available_days integer DEFAULT 1 NOT NULL,
    target_hourly_output integer NOT NULL,
    planned_efficiency double precision DEFAULT 80.0 NOT NULL,
    allowance_pfd character varying(50) DEFAULT '5,4,1'::character varying,
    total_smv_minutes double precision DEFAULT 0.0 NOT NULL,
    customer_takt_secs double precision DEFAULT 0.0 NOT NULL,
    required_design_capacity double precision DEFAULT 0.0 NOT NULL,
    designed_pitch_secs double precision DEFAULT 0.0 NOT NULL,
    theoretical_manpower double precision DEFAULT 0.0 NOT NULL,
    planned_manpower double precision DEFAULT 0.0 NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.capacity_plans OWNER TO postgres;

--
-- Name: capacity_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.capacity_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.capacity_plans_id_seq OWNER TO postgres;

--
-- Name: capacity_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.capacity_plans_id_seq OWNED BY public.capacity_plans.id;


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_conversations (
    id bigint NOT NULL,
    user_identifier character varying(100) DEFAULT 'default_user'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    context_metadata text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_conversations OWNER TO postgres;

--
-- Name: chat_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_conversations_id_seq OWNER TO postgres;

--
-- Name: chat_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_conversations_id_seq OWNED BY public.chat_conversations.id;


--
-- Name: chat_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_feedback (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    is_helpful boolean NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_feedback OWNER TO postgres;

--
-- Name: chat_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_feedback_id_seq OWNER TO postgres;

--
-- Name: chat_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_feedback_id_seq OWNED BY public.chat_feedback.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    sender character varying(20) NOT NULL,
    message_text text NOT NULL,
    intent character varying(100),
    data_source character varying(50) DEFAULT 'APPLICATION_DATA'::character varying,
    data_available boolean DEFAULT true,
    structured_payload text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_sender_check CHECK (((sender)::text = ANY ((ARRAY['USER'::character varying, 'ASSISTANT'::character varying, 'SYSTEM'::character varying])::text[])))
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- Name: hourly_production_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hourly_production_entries (
    id bigint NOT NULL,
    line_plan_id bigint NOT NULL,
    operation_id bigint NOT NULL,
    operator_id bigint NOT NULL,
    log_date date DEFAULT CURRENT_DATE NOT NULL,
    shift_hour integer NOT NULL,
    hour_start_time time without time zone,
    hour_end_time time without time zone,
    target_qty integer DEFAULT 0 NOT NULL,
    actual_qty integer DEFAULT 0 NOT NULL,
    good_qty integer DEFAULT 0 NOT NULL,
    reject_qty integer DEFAULT 0 NOT NULL,
    sam_minutes numeric(8,4) DEFAULT 0.35 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT hourly_production_entries_shift_hour_check CHECK (((shift_hour >= 1) AND (shift_hour <= 12)))
);


ALTER TABLE public.hourly_production_entries OWNER TO postgres;

--
-- Name: hourly_production_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hourly_production_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hourly_production_entries_id_seq OWNER TO postgres;

--
-- Name: hourly_production_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hourly_production_entries_id_seq OWNED BY public.hourly_production_entries.id;


--
-- Name: line_design_machines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_design_machines (
    id bigint NOT NULL,
    line_design_id bigint NOT NULL,
    machine_type character varying(100) NOT NULL,
    required_qty integer DEFAULT 1 NOT NULL,
    available_qty integer DEFAULT 0 NOT NULL,
    notes character varying(255)
);


ALTER TABLE public.line_design_machines OWNER TO postgres;

--
-- Name: line_design_machines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.line_design_machines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.line_design_machines_id_seq OWNER TO postgres;

--
-- Name: line_design_machines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.line_design_machines_id_seq OWNED BY public.line_design_machines.id;


--
-- Name: line_designs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_designs (
    id bigint NOT NULL,
    design_code character varying(50) NOT NULL,
    capacity_plan_id bigint,
    order_id bigint,
    bulletin_id bigint,
    line_id bigint,
    shift_id bigint,
    total_workstations integer DEFAULT 1 NOT NULL,
    total_operators integer DEFAULT 1 NOT NULL,
    total_helpers integer DEFAULT 0 NOT NULL,
    total_qc integer DEFAULT 0 NOT NULL,
    total_machines integer DEFAULT 0 NOT NULL,
    target_hourly_output integer NOT NULL,
    planned_efficiency double precision DEFAULT 80.0 NOT NULL,
    designed_pitch_secs double precision DEFAULT 0.0 NOT NULL,
    line_balance_efficiency double precision DEFAULT 0.0 NOT NULL,
    status character varying(50) DEFAULT 'DRAFT'::character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_by character varying(100),
    approved_by character varying(100),
    released_by character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    strategy_name character varying(50),
    station_allocations text,
    workstations_json text,
    CONSTRAINT line_designs_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'BALANCED'::character varying, 'APPROVED'::character varying, 'RELEASED'::character varying, 'ACTIVE'::character varying, 'CLOSED'::character varying])::text[])))
);


ALTER TABLE public.line_designs OWNER TO postgres;

--
-- Name: line_designs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.line_designs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.line_designs_id_seq OWNER TO postgres;

--
-- Name: line_designs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.line_designs_id_seq OWNED BY public.line_designs.id;


--
-- Name: line_plan_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_plan_assignments (
    id bigint NOT NULL,
    line_plan_id bigint NOT NULL,
    bulletin_line_id bigint,
    operation_id bigint NOT NULL,
    operator_id bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_qc_checkpoint boolean DEFAULT false NOT NULL
);


ALTER TABLE public.line_plan_assignments OWNER TO postgres;

--
-- Name: line_plan_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.line_plan_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.line_plan_assignments_id_seq OWNER TO postgres;

--
-- Name: line_plan_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.line_plan_assignments_id_seq OWNED BY public.line_plan_assignments.id;


--
-- Name: line_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_plans (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    shift_id bigint NOT NULL,
    target_output integer NOT NULL,
    allowance integer DEFAULT 10 NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    line_id bigint,
    allowance_pfd character varying(100) DEFAULT '5,4,1'::character varying,
    planned_efficiency double precision DEFAULT 80.00
);


ALTER TABLE public.line_plans OWNER TO postgres;

--
-- Name: line_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.line_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.line_plans_id_seq OWNER TO postgres;

--
-- Name: line_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.line_plans_id_seq OWNED BY public.line_plans.id;


--
-- Name: machines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.machines (
    id bigint NOT NULL,
    machine_code character varying(50) NOT NULL,
    machine_type character varying(100) NOT NULL,
    brand character varying(100),
    model character varying(100),
    serial_no character varying(100),
    line_id bigint,
    status character varying(30) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    CONSTRAINT machines_status_check CHECK (((status)::text = ANY ((ARRAY['AVAILABLE'::character varying, 'IN_USE'::character varying, 'UNDER_MAINTENANCE'::character varying, 'IDLE'::character varying])::text[])))
);


ALTER TABLE public.machines OWNER TO postgres;

--
-- Name: machines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.machines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.machines_id_seq OWNER TO postgres;

--
-- Name: machines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.machines_id_seq OWNED BY public.machines.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    severity character varying(20) DEFAULT 'WARNING'::character varying NOT NULL,
    recipient_role character varying(50) DEFAULT 'MANAGER'::character varying,
    operator_id bigint,
    shift_id bigint,
    reference_id bigint,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: operation_affinities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operation_affinities (
    id bigint NOT NULL,
    primary_operation_id bigint NOT NULL,
    alternative_operation_id bigint NOT NULL,
    affinity_level character varying(30) DEFAULT 'DIRECT_SUBSTITUTE'::character varying NOT NULL,
    efficiency_transfer_pct numeric(5,2) DEFAULT 90.00 NOT NULL,
    rating_downgrade integer DEFAULT 0 NOT NULL,
    machine_compatible boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_diff_operations CHECK ((primary_operation_id <> alternative_operation_id))
);


ALTER TABLE public.operation_affinities OWNER TO postgres;

--
-- Name: operation_affinities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operation_affinities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_affinities_id_seq OWNER TO postgres;

--
-- Name: operation_affinities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operation_affinities_id_seq OWNED BY public.operation_affinities.id;


--
-- Name: operation_bulletins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operation_bulletins (
    id bigint NOT NULL,
    bulletin_code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    version integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    effective_from date,
    effective_to date,
    total_smv numeric(10,4) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    revision_number integer DEFAULT 1,
    parent_bulletin_id bigint,
    approved_by character varying(100),
    approved_at timestamp without time zone,
    released_by character varying(100),
    released_at timestamp without time zone,
    CONSTRAINT operation_bulletins_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'UNDER_REVIEW'::character varying, 'APPROVED'::character varying, 'RELEASED'::character varying, 'PUBLISHED'::character varying, 'ARCHIVED'::character varying, 'OBSOLETE'::character varying])::text[])))
);


ALTER TABLE public.operation_bulletins OWNER TO postgres;

--
-- Name: TABLE operation_bulletins; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.operation_bulletins IS 'Operation Bulletin header. One bulletin can be linked to multiple styles via bulletin_styles.';


--
-- Name: COLUMN operation_bulletins.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operation_bulletins.status IS 'DRAFT=in-progress, PUBLISHED=in-use, ARCHIVED=retired.';


--
-- Name: COLUMN operation_bulletins.total_smv; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operation_bulletins.total_smv IS 'Sum of all bulletin_lines.smv. Updated by application.';


--
-- Name: operation_bulletins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operation_bulletins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_bulletins_id_seq OWNER TO postgres;

--
-- Name: operation_bulletins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operation_bulletins_id_seq OWNED BY public.operation_bulletins.id;


--
-- Name: operations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operations (
    id bigint NOT NULL,
    operation_code character varying(20) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    sequence integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    standard_smv numeric(8,4),
    machine_type character varying(100)
);


ALTER TABLE public.operations OWNER TO postgres;

--
-- Name: TABLE operations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.operations IS 'Operation master: each row is a distinct sewing operation (e.g., Shoulder Join, Bottom Hem).';


--
-- Name: COLUMN operations.operation_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operations.operation_code IS 'Unique code, e.g. OP-001. Used as SAP reference key.';


--
-- Name: COLUMN operations.sequence; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operations.sequence IS 'Default display/processing order.';


--
-- Name: COLUMN operations.standard_smv; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operations.standard_smv IS 'SAM: Standard Allowed Minutes per piece. Used to calculate hourly target and operator efficiency.';


--
-- Name: COLUMN operations.machine_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operations.machine_type IS 'Required sewing machine type for this operation (e.g. Single Needle Lockstitch, 4-Thread Overlock, Flatlock).';


--
-- Name: operations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operations_id_seq OWNER TO postgres;

--
-- Name: operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operations_id_seq OWNED BY public.operations.id;


--
-- Name: operator_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operator_attachments (
    id bigint NOT NULL,
    operator_id bigint NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(255) NOT NULL,
    data bytea NOT NULL,
    uploaded_at timestamp without time zone NOT NULL
);


ALTER TABLE public.operator_attachments OWNER TO postgres;

--
-- Name: operator_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operator_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operator_attachments_id_seq OWNER TO postgres;

--
-- Name: operator_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operator_attachments_id_seq OWNED BY public.operator_attachments.id;


--
-- Name: operator_performance_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operator_performance_logs (
    id bigint NOT NULL,
    operator_id bigint NOT NULL,
    operation_id bigint NOT NULL,
    log_date date NOT NULL,
    actual_cycle_time_seconds integer NOT NULL,
    recorded_by character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    status character varying(30) DEFAULT 'DRAFT'::character varying
);


ALTER TABLE public.operator_performance_logs OWNER TO postgres;

--
-- Name: operator_performance_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operator_performance_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operator_performance_logs_id_seq OWNER TO postgres;

--
-- Name: operator_performance_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operator_performance_logs_id_seq OWNED BY public.operator_performance_logs.id;


--
-- Name: operator_station_placements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operator_station_placements (
    id bigint NOT NULL,
    line_design_id bigint NOT NULL,
    balance_workstation_id bigint NOT NULL,
    operator_id bigint,
    required_skill_level integer DEFAULT 3,
    actual_skill_level integer,
    match_status character varying(50) DEFAULT 'MATCH'::character varying NOT NULL,
    notes character varying(255),
    CONSTRAINT operator_station_placements_match_status_check CHECK (((match_status)::text = ANY ((ARRAY['EXCELLENT'::character varying, 'MATCH'::character varying, 'GAP'::character varying, 'TRAINING_REQUIRED'::character varying, 'UNASSIGNED'::character varying])::text[])))
);


ALTER TABLE public.operator_station_placements OWNER TO postgres;

--
-- Name: operator_station_placements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operator_station_placements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operator_station_placements_id_seq OWNER TO postgres;

--
-- Name: operator_station_placements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operator_station_placements_id_seq OWNED BY public.operator_station_placements.id;


--
-- Name: operators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operators (
    id bigint NOT NULL,
    employee_id character varying(30) NOT NULL,
    name character varying(150) NOT NULL,
    age integer NOT NULL,
    gender character varying(10) NOT NULL,
    department character varying(100) NOT NULL,
    joining_date date NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    role character varying(50) DEFAULT 'OPERATOR'::character varying NOT NULL,
    CONSTRAINT operators_age_check CHECK (((age >= 16) AND (age <= 70))),
    CONSTRAINT operators_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.operators OWNER TO postgres;

--
-- Name: TABLE operators; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.operators IS 'Sewing/Swing operators on the factory floor. Shift is tracked via shift_assignments.';


--
-- Name: COLUMN operators.employee_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.operators.employee_id IS 'Unique business employee identifier, e.g. EMP-1001';


--
-- Name: operators_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operators_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operators_id_seq OWNER TO postgres;

--
-- Name: operators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operators_id_seq OWNED BY public.operators.id;


--
-- Name: optimization_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.optimization_recommendations (
    id bigint NOT NULL,
    line_design_id bigint NOT NULL,
    balance_workstation_id bigint,
    strategy_type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    reason text NOT NULL,
    current_cycle_time_secs double precision,
    projected_cycle_time_secs double precision,
    projected_capacity_per_hour double precision,
    status character varying(50) DEFAULT 'PROPOSED'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT optimization_recommendations_status_check CHECK (((status)::text = ANY ((ARRAY['PROPOSED'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying])::text[]))),
    CONSTRAINT optimization_recommendations_strategy_type_check CHECK (((strategy_type)::text = ANY ((ARRAY['PARALLEL_OP'::character varying, 'SPLIT_OPERATION'::character varying, 'OPERATOR_SWAP'::character varying, 'MACHINE_UPGRADE'::character varying, 'COMBINE_STATIONS'::character varying])::text[])))
);


ALTER TABLE public.optimization_recommendations OWNER TO postgres;

--
-- Name: optimization_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.optimization_recommendations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.optimization_recommendations_id_seq OWNER TO postgres;

--
-- Name: optimization_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.optimization_recommendations_id_seq OWNED BY public.optimization_recommendations.id;


--
-- Name: order_size_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_size_lines (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    size_id bigint NOT NULL,
    quantity integer NOT NULL,
    CONSTRAINT order_size_lines_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.order_size_lines OWNER TO postgres;

--
-- Name: TABLE order_size_lines; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_size_lines IS 'Size-wise quantity breakdown for each order. Cascades delete from parent orders.';


--
-- Name: order_size_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_size_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_size_lines_id_seq OWNER TO postgres;

--
-- Name: order_size_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_size_lines_id_seq OWNED BY public.order_size_lines.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    order_no character varying(50) NOT NULL,
    buyer character varying(150) NOT NULL,
    style_id bigint NOT NULL,
    color character varying(100) NOT NULL,
    order_date date NOT NULL,
    delivery_date date NOT NULL,
    status character varying(20) DEFAULT 'PLANNED'::character varying NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    planned_completion_date date,
    CONSTRAINT chk_delivery_date CHECK ((delivery_date >= order_date)),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['PLANNED'::character varying, 'IN_PRODUCTION'::character varying, 'COMPLETED'::character varying, 'ON_HOLD'::character varying])::text[]))),
    CONSTRAINT orders_total_quantity_check CHECK ((total_quantity >= 0))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: TABLE orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.orders IS 'Production order header. Size-wise quantities are in order_size_lines child table.';


--
-- Name: COLUMN orders.total_quantity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.total_quantity IS 'Auto-calculated = SUM(order_size_lines.quantity). Updated by application on insert/update.';


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: piece_production_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.piece_production_logs (
    id bigint NOT NULL,
    operator_id bigint NOT NULL,
    operation_id bigint,
    operation_name character varying(150),
    order_id bigint,
    target_qty integer DEFAULT 0 NOT NULL,
    completed_qty integer DEFAULT 0 NOT NULL,
    good_qty integer DEFAULT 0 NOT NULL,
    reject_qty integer DEFAULT 0 NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    actual_time_minutes numeric(8,2) DEFAULT 0 NOT NULL,
    sam_minutes numeric(8,4) DEFAULT 0.35 NOT NULL,
    machine_code character varying(100),
    log_date date DEFAULT CURRENT_DATE NOT NULL,
    hour_slot integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT piece_production_logs_hour_slot_check CHECK (((hour_slot >= 0) AND (hour_slot <= 23)))
);


ALTER TABLE public.piece_production_logs OWNER TO postgres;

--
-- Name: piece_production_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.piece_production_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.piece_production_logs_id_seq OWNER TO postgres;

--
-- Name: piece_production_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.piece_production_logs_id_seq OWNED BY public.piece_production_logs.id;


--
-- Name: sewing_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sewing_lines (
    id bigint NOT NULL,
    line_code character varying(30) NOT NULL,
    line_name character varying(100) NOT NULL,
    floor character varying(50),
    supervisor_name character varying(150),
    target_efficiency_percent numeric(5,2) DEFAULT 85.00 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    operator_count integer DEFAULT 20 NOT NULL,
    machine_count integer DEFAULT 22 NOT NULL,
    working_hours numeric(4,2) DEFAULT 8.00 NOT NULL,
    capacity_per_day integer DEFAULT 1000 NOT NULL,
    CONSTRAINT sewing_lines_capacity_per_day_check CHECK ((capacity_per_day > 0)),
    CONSTRAINT sewing_lines_machine_count_check CHECK ((machine_count > 0)),
    CONSTRAINT sewing_lines_operator_count_check CHECK ((operator_count > 0)),
    CONSTRAINT sewing_lines_target_efficiency_percent_check CHECK (((target_efficiency_percent >= (0)::numeric) AND (target_efficiency_percent <= (100)::numeric))),
    CONSTRAINT sewing_lines_working_hours_check CHECK ((working_hours > (0)::numeric))
);


ALTER TABLE public.sewing_lines OWNER TO postgres;

--
-- Name: sewing_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sewing_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sewing_lines_id_seq OWNER TO postgres;

--
-- Name: sewing_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sewing_lines_id_seq OWNED BY public.sewing_lines.id;


--
-- Name: shift_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_assignments (
    id bigint NOT NULL,
    operator_id bigint NOT NULL,
    shift_id bigint NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_sa_dates CHECK (((effective_to IS NULL) OR (effective_to >= effective_from))),
    CONSTRAINT shift_assignments_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SCHEDULED'::character varying, 'COMPLETED'::character varying])::text[])))
);


ALTER TABLE public.shift_assignments OWNER TO postgres;

--
-- Name: TABLE shift_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.shift_assignments IS 'Temporal shift assignment history per operator. effective_to=NULL means currently active.';


--
-- Name: COLUMN shift_assignments.effective_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.shift_assignments.effective_to IS 'NULL = currently active with no end date. Business rule: one NULL per operator at a time.';


--
-- Name: shift_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_assignments_id_seq OWNER TO postgres;

--
-- Name: shift_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_assignments_id_seq OWNED BY public.shift_assignments.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id bigint NOT NULL,
    shift_code character varying(20) NOT NULL,
    shift_name character varying(100) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    break_duration_minutes integer DEFAULT 60 NOT NULL,
    CONSTRAINT shifts_break_duration_minutes_check CHECK ((break_duration_minutes >= 0))
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: TABLE shifts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.shifts IS 'Configurable production shifts. Overnight shifts supported (end_time < start_time means next-day end).';


--
-- Name: COLUMN shifts.shift_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.shifts.shift_code IS 'Unique business code: A, B, C, GENERAL etc.';


--
-- Name: COLUMN shifts.break_duration_minutes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.shifts.break_duration_minutes IS 'Total scheduled break time in minutes (lunch + tea breaks). Deducted from gross shift duration.';


--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_id_seq OWNER TO postgres;

--
-- Name: shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_id_seq OWNED BY public.shifts.id;


--
-- Name: sizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sizes (
    id bigint NOT NULL,
    code character varying(10) NOT NULL,
    label character varying(50) NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sizes OWNER TO postgres;

--
-- Name: TABLE sizes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sizes IS 'Configurable garment size master. Referenced by orders for size-wise quantity breakdown.';


--
-- Name: sizes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sizes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sizes_id_seq OWNER TO postgres;

--
-- Name: sizes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sizes_id_seq OWNED BY public.sizes.id;


--
-- Name: skill_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_assessments (
    id bigint NOT NULL,
    operator_id bigint NOT NULL,
    operation_id bigint NOT NULL,
    rating integer NOT NULL,
    cycle_time_seconds integer NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    effective_date date NOT NULL,
    is_current boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT skill_assessments_cycle_time_seconds_check CHECK ((cycle_time_seconds > 0)),
    CONSTRAINT skill_assessments_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.skill_assessments OWNER TO postgres;

--
-- Name: TABLE skill_assessments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.skill_assessments IS 'Swing Skill Matrix with revision history. Never delete — always insert new revision and mark old as is_current=FALSE.';


--
-- Name: COLUMN skill_assessments.rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_assessments.rating IS '1=Beginner, 2=Basic, 3=Standard, 4=Good, 5=Expert.';


--
-- Name: COLUMN skill_assessments.cycle_time_seconds; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_assessments.cycle_time_seconds IS 'Time in seconds to complete one unit of this operation.';


--
-- Name: COLUMN skill_assessments.is_current; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.skill_assessments.is_current IS 'TRUE for the latest revision only. Enforced by partial unique index.';


--
-- Name: skill_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_assessments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_assessments_id_seq OWNER TO postgres;

--
-- Name: skill_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_assessments_id_seq OWNED BY public.skill_assessments.id;


--
-- Name: skill_matrix_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_matrix_history (
    id bigint NOT NULL,
    operator_id bigint NOT NULL,
    operation_id bigint NOT NULL,
    old_rating integer NOT NULL,
    new_rating integer NOT NULL,
    updated_by character varying(255) NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.skill_matrix_history OWNER TO postgres;

--
-- Name: skill_matrix_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_matrix_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_matrix_history_id_seq OWNER TO postgres;

--
-- Name: skill_matrix_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_matrix_history_id_seq OWNED BY public.skill_matrix_history.id;


--
-- Name: styles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.styles (
    id bigint NOT NULL,
    style_no character varying(50) NOT NULL,
    buyer character varying(150) NOT NULL,
    description text,
    season character varying(50),
    product_type character varying(100),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.styles OWNER TO postgres;

--
-- Name: TABLE styles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.styles IS 'Style master — each row is a garment style produced by the factory.';


--
-- Name: COLUMN styles.style_no; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.styles.style_no IS 'Unique business style number, e.g. TS-1001.';


--
-- Name: styles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.styles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.styles_id_seq OWNER TO postgres;

--
-- Name: styles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.styles_id_seq OWNED BY public.styles.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: balance_station_operations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_station_operations ALTER COLUMN id SET DEFAULT nextval('public.balance_station_operations_id_seq'::regclass);


--
-- Name: balance_workstations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_workstations ALTER COLUMN id SET DEFAULT nextval('public.balance_workstations_id_seq'::regclass);


--
-- Name: bulletin_lines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_lines ALTER COLUMN id SET DEFAULT nextval('public.bulletin_lines_id_seq'::regclass);


--
-- Name: capacity_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans ALTER COLUMN id SET DEFAULT nextval('public.capacity_plans_id_seq'::regclass);


--
-- Name: chat_conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_conversations ALTER COLUMN id SET DEFAULT nextval('public.chat_conversations_id_seq'::regclass);


--
-- Name: chat_feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_feedback ALTER COLUMN id SET DEFAULT nextval('public.chat_feedback_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: hourly_production_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_production_entries ALTER COLUMN id SET DEFAULT nextval('public.hourly_production_entries_id_seq'::regclass);


--
-- Name: line_design_machines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_design_machines ALTER COLUMN id SET DEFAULT nextval('public.line_design_machines_id_seq'::regclass);


--
-- Name: line_designs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs ALTER COLUMN id SET DEFAULT nextval('public.line_designs_id_seq'::regclass);


--
-- Name: line_plan_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plan_assignments ALTER COLUMN id SET DEFAULT nextval('public.line_plan_assignments_id_seq'::regclass);


--
-- Name: line_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plans ALTER COLUMN id SET DEFAULT nextval('public.line_plans_id_seq'::regclass);


--
-- Name: machines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machines ALTER COLUMN id SET DEFAULT nextval('public.machines_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: operation_affinities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_affinities ALTER COLUMN id SET DEFAULT nextval('public.operation_affinities_id_seq'::regclass);


--
-- Name: operation_bulletins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_bulletins ALTER COLUMN id SET DEFAULT nextval('public.operation_bulletins_id_seq'::regclass);


--
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- Name: operator_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_attachments ALTER COLUMN id SET DEFAULT nextval('public.operator_attachments_id_seq'::regclass);


--
-- Name: operator_performance_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_performance_logs ALTER COLUMN id SET DEFAULT nextval('public.operator_performance_logs_id_seq'::regclass);


--
-- Name: operator_station_placements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_station_placements ALTER COLUMN id SET DEFAULT nextval('public.operator_station_placements_id_seq'::regclass);


--
-- Name: operators id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operators ALTER COLUMN id SET DEFAULT nextval('public.operators_id_seq'::regclass);


--
-- Name: optimization_recommendations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimization_recommendations ALTER COLUMN id SET DEFAULT nextval('public.optimization_recommendations_id_seq'::regclass);


--
-- Name: order_size_lines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_size_lines ALTER COLUMN id SET DEFAULT nextval('public.order_size_lines_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: piece_production_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piece_production_logs ALTER COLUMN id SET DEFAULT nextval('public.piece_production_logs_id_seq'::regclass);


--
-- Name: sewing_lines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sewing_lines ALTER COLUMN id SET DEFAULT nextval('public.sewing_lines_id_seq'::regclass);


--
-- Name: shift_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_assignments ALTER COLUMN id SET DEFAULT nextval('public.shift_assignments_id_seq'::regclass);


--
-- Name: shifts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id SET DEFAULT nextval('public.shifts_id_seq'::regclass);


--
-- Name: sizes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sizes ALTER COLUMN id SET DEFAULT nextval('public.sizes_id_seq'::regclass);


--
-- Name: skill_assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_assessments ALTER COLUMN id SET DEFAULT nextval('public.skill_assessments_id_seq'::regclass);


--
-- Name: skill_matrix_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_matrix_history ALTER COLUMN id SET DEFAULT nextval('public.skill_matrix_history_id_seq'::regclass);


--
-- Name: styles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.styles ALTER COLUMN id SET DEFAULT nextval('public.styles_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, entity_type, entity_id, action, details, user_name, log_type, is_secure, "timestamp") FROM stdin;
1	SHIFT	1	updated shift A Shift	Admin	Admin	default	f	2026-08-22 12:41:50.168377
2	SHIFT	1	updated shift A Shift	Admin	Admin	default	f	2026-08-22 12:45:46.239756
3	OPERATOR	52	updated Skill Ratings for Neck Top Stitch	Admin	Admin	default	f	2026-08-22 12:46:26.748969
4	OPERATOR	52	updated Skill Ratings for Neck Rib Attach	Admin	Admin	default	f	2026-08-22 12:46:26.76483
5	OPERATOR	52	updated Skill Ratings for Sleeve Attach Left	Admin	Admin	default	f	2026-08-22 12:46:26.76483
6	OPERATOR	52	updated Skill Ratings for Shoulder Join	Admin	Admin	default	f	2026-08-22 12:46:26.765852
7	OPERATION	18	changed status to Inactive	Admin	Admin	default	f	2026-08-22 12:47:53.810045
8	OPERATION	18	changed status to Active	Admin	Admin	default	f	2026-08-22 12:48:06.175828
9	SHIFT	3	changed status to Inactive	Admin	Admin	default	f	2026-08-22 12:59:55.924308
10	SHIFT	5	created shift D Shift	Admin	Admin	default	f	2026-08-22 13:02:14.743184
11	SHIFT	3	changed status to Active	Admin	Admin	default	f	2026-08-22 13:02:46.911267
12	SHIFT	5	deleted shift D Shift	Admin	Admin	default	f	2026-08-22 13:06:53.015502
13	OPERATOR	29	recorded attendance as PRESENT	System	Admin	attendance	f	2026-08-22 15:16:12.767614
14	OPERATOR	29	recorded attendance as PRESENT	System	Admin	attendance	f	2026-08-22 16:10:07.588182
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_records (id, attendance_date, operator_id, shift_id, status, check_in_time, check_out_time, remarks, created_at, updated_at) FROM stdin;
179	2026-09-08	69	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
194	2026-09-08	70	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
195	2026-09-08	71	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
196	2026-09-08	72	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
197	2026-09-08	73	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
198	2026-09-08	74	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
199	2026-09-08	75	1	ON_LEAVE	08:40:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
200	2026-09-08	76	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
201	2026-09-08	77	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
202	2026-09-08	78	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
203	2026-09-08	79	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
204	2026-09-08	80	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
205	2026-09-08	81	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
206	2026-09-08	82	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
207	2026-09-08	83	1	LATE	08:40:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
208	2026-09-08	84	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
209	2026-09-08	85	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
210	2026-09-08	86	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
211	2026-09-08	87	1	ON_LEAVE	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
212	2026-09-08	88	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
213	2026-09-08	89	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
214	2026-09-08	90	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
215	2026-09-08	91	1	LATE	08:40:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
216	2026-09-08	92	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
217	2026-09-08	93	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
218	2026-09-08	94	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
219	2026-09-08	95	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
220	2026-09-08	96	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
221	2026-09-08	97	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
222	2026-09-08	98	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
223	2026-09-08	99	1	ON_LEAVE	08:40:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
224	2026-09-08	100	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
225	2026-09-08	101	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
226	2026-09-08	102	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
227	2026-09-08	103	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
228	2026-09-08	104	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
229	2026-09-08	105	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
230	2026-09-08	106	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
231	2026-09-08	107	1	LATE	08:40:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
232	2026-09-08	108	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
233	2026-09-08	109	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
234	2026-09-08	110	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
235	2026-09-08	111	1	ON_LEAVE	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
236	2026-09-08	112	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
237	2026-09-08	113	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
238	2026-09-08	114	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
239	2026-09-08	115	1	LATE	08:40:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
240	2026-09-08	116	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
241	2026-09-08	117	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
242	2026-09-08	118	1	PRESENT	08:00:00	17:00:00	Biometric floor punch-in	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, entity_name, entity_id, action, performed_by, "timestamp", details) FROM stdin;
1	AttendanceRecord	5	Created	System	2026-08-22 17:49:44.115673	\N
2	Style	1	Updated	System	2026-08-22 18:01:53.523172	\N
3	Style	1	Updated	System	2026-08-22 18:01:54.714837	\N
4	Shift	1	Updated	System	2026-08-22 18:06:01.714513	\N
5	Shift	1	Updated	System	2026-08-22 18:06:05.148377	\N
6	Shift	1	Updated	System	2026-08-22 18:06:13.973739	\N
7	Shift	1	Updated	System	2026-08-22 18:06:19.778365	\N
8	Operator	52	Updated	System	2026-08-22 18:06:34.863319	\N
9	Operator	52	Updated	System	2026-08-22 18:06:46.418293	\N
10	SkillAssessment	30	Created	System	2026-08-22 18:08:41.029865	\N
11	SkillAssessment	29	Created	System	2026-08-22 18:08:41.029865	\N
12	SkillAssessment	28	Created	System	2026-08-22 18:08:41.029865	\N
13	SkillAssessment	31	Created	System	2026-08-22 18:08:41.029865	\N
14	Shift	1	Updated	System	2026-08-22 18:29:37.205354	\N
15	Shift	1	Updated	System	2026-08-22 18:29:41.602828	\N
16	Operator	52	Updated	System	2026-08-22 18:30:04.248107	\N
17	Operator	52	Updated	System	2026-08-22 18:30:05.949074	\N
18	SkillAssessment	34	Created	System	2026-08-22 18:31:09.508735	\N
19	SkillAssessment	35	Created	System	2026-08-22 18:31:09.508735	\N
20	SkillAssessment	33	Created	System	2026-08-22 18:31:09.508735	\N
21	SkillAssessment	32	Created	System	2026-08-22 18:31:09.508735	\N
22	Operator	52	Updated	System	2026-08-22 18:35:19.293204	\N
23	Operator	52	Updated	System	2026-08-22 18:35:20.34688	\N
2270	Notification	43	Updated	Admin	2026-09-10 16:53:48.15972	Updated Notification #43
25	AttendanceRecord	7	Created	System	2026-08-22 18:36:31.954208	\N
26	AttendanceRecord	8	Created	System	2026-08-22 18:36:31.965647	\N
27	AttendanceRecord	9	Created	System	2026-08-22 18:36:31.978936	\N
28	AttendanceRecord	5	Updated	System	2026-08-22 18:36:32.0005	\N
29	AttendanceRecord	10	Created	System	2026-08-22 18:36:32.004308	\N
30	SkillAssessment	39	Created	System	2026-08-22 18:50:22.172924	\N
31	SkillAssessment	36	Created	System	2026-08-22 18:50:22.172924	\N
32	SkillAssessment	38	Created	System	2026-08-22 18:50:22.172924	\N
33	SkillAssessment	37	Created	System	2026-08-22 18:50:22.172924	\N
34	Shift	1	Updated	System	2026-08-24 09:50:24.926656	\N
35	Shift	2	Updated	System	2026-08-24 09:50:45.576633	\N
36	Shift	6	Created	System	2026-08-24 09:54:07.28591	\N
37	Shift	1	Updated	System	2026-08-24 10:01:27.589342	\N
38	Shift	1	Updated	System	2026-08-24 10:01:33.478365	\N
39	Shift	6	Deleted	System	2026-08-24 10:12:36.087681	\N
40	Operation	1	Updated	System	2026-08-24 10:34:55.004546	\N
41	Operation	1	Updated	System	2026-08-24 10:34:56.072866	\N
42	Size	1	Updated	System	2026-08-24 10:37:20.28471	\N
43	Size	1	Updated	System	2026-08-24 10:37:28.504584	\N
44	Size	7	Created	System	2026-08-24 11:03:18.737129	\N
45	Operator	52	Updated	System	2026-08-24 11:11:23.52239	\N
46	Operator	52	Updated	System	2026-08-24 11:11:24.976788	\N
47	Shift	4	Updated	System	2026-08-24 11:11:35.993593	\N
48	Shift	4	Updated	System	2026-08-24 11:11:37.944426	\N
49	Operation	1	Updated	System	2026-08-24 11:20:06.690266	\N
50	Operation	1	Updated	System	2026-08-24 11:20:07.712464	\N
51	Operation	1	Updated	System	2026-08-24 11:29:28.525794	\N
52	Operation	1	Updated	System	2026-08-24 11:29:29.557264	\N
53	Operation	1	Updated	System	2026-08-24 11:29:32.697347	\N
54	Operation	1	Updated	System	2026-08-24 11:29:33.703304	\N
55	OperatorPerformanceLog	1	Created	System	2026-08-24 12:30:22.355906	\N
56	OperatorPerformanceLog	2	Created	System	2026-08-24 12:34:40.245914	\N
57	OperatorPerformanceLog	3	Created	System	2026-08-24 12:34:51.238901	\N
58	SkillAssessment	40	Created	System	2026-08-24 12:44:30.290736	\N
59	SkillAssessment	41	Created	System	2026-08-24 12:44:38.198588	\N
60	SkillAssessment	42	Created	System	2026-08-24 12:44:39.256554	\N
61	SkillAssessment	43	Created	System	2026-08-24 12:44:40.369869	\N
62	SkillAssessment	44	Created	System	2026-08-24 12:44:41.166236	\N
63	SkillAssessment	45	Created	System	2026-08-24 12:44:41.334969	\N
64	SkillAssessment	46	Created	System	2026-08-24 12:44:41.558461	\N
65	OperatorPerformanceLog	4	Created	System	2026-08-24 12:44:51.47144	\N
66	OperatorPerformanceLog	5	Created	System	2026-08-24 12:44:51.510772	\N
67	OperatorPerformanceLog	6	Created	System	2026-08-24 12:44:51.540829	\N
68	SkillAssessment	47	Created	System	2026-08-24 12:44:51.574742	\N
69	SkillAssessment	48	Created	System	2026-08-24 12:45:38.196343	\N
70	SkillAssessment	49	Created	System	2026-08-24 12:52:59.424597	\N
71	SkillAssessment	51	Created	System	2026-08-24 12:59:49.90412	\N
73	SkillAssessment	50	Created	System	2026-08-24 12:59:49.906652	\N
72	SkillAssessment	52	Created	System	2026-08-24 12:59:49.906652	\N
74	SkillAssessment	53	Created	System	2026-08-24 12:59:49.916298	\N
75	SkillAssessment	56	Created	System	2026-08-24 13:16:43.924461	\N
76	SkillAssessment	54	Created	System	2026-08-24 13:16:43.924461	\N
77	SkillAssessment	55	Created	System	2026-08-24 13:16:43.924461	\N
78	SkillAssessment	57	Created	System	2026-08-24 13:16:43.933243	\N
79	OperatorPerformanceLog	7	Created	System	2026-08-24 13:28:57.480836	\N
80	SkillAssessment	58	Created	System	2026-08-24 13:28:57.516937	\N
81	OperatorPerformanceLog	8	Created	System	2026-08-24 13:29:45.496087	\N
82	SkillAssessment	59	Created	System	2026-08-24 13:29:45.514667	\N
83	OperatorPerformanceLog	9	Created	System	2026-08-24 13:35:24.103025	\N
84	SkillAssessment	60	Created	System	2026-08-24 13:35:24.135676	\N
85	OperatorPerformanceLog	10	Created	System	2026-08-24 13:37:11.858874	\N
86	SkillAssessment	61	Created	System	2026-08-24 13:37:11.887053	\N
87	OperatorPerformanceLog	11	Created	System	2026-08-24 13:38:20.123293	\N
88	SkillAssessment	62	Created	System	2026-08-24 13:38:20.155125	\N
89	OperatorPerformanceLog	12	Created	System	2026-08-24 13:38:35.899738	\N
90	SkillAssessment	63	Created	System	2026-08-24 13:38:35.931898	\N
91	OperatorPerformanceLog	13	Created	System	2026-08-24 13:38:47.739965	\N
92	SkillAssessment	64	Created	System	2026-08-24 13:38:47.788245	\N
93	SkillAssessment	65	Created	System	2026-08-24 13:38:50.820098	\N
94	OperatorPerformanceLog	14	Created	System	2026-08-24 13:39:24.995258	\N
95	SkillAssessment	66	Created	System	2026-08-24 13:39:25.031969	\N
96	OperatorPerformanceLog	15	Created	System	2026-08-24 13:39:45.48795	\N
97	SkillAssessment	67	Created	System	2026-08-24 13:39:45.514394	\N
98	OperatorPerformanceLog	16	Created	System	2026-08-24 13:40:04.848533	\N
99	SkillAssessment	68	Created	System	2026-08-24 13:40:04.879238	\N
100	OperatorPerformanceLog	17	Created	Admin	2026-08-24 15:13:54.757751	\N
101	SkillAssessment	69	Created	Admin	2026-08-24 15:13:54.823011	\N
102	SkillAssessment	70	Created	Admin	2026-08-24 15:13:54.962735	\N
103	OperatorPerformanceLog	18	Created	Admin	2026-08-24 15:14:22.438065	\N
104	OperatorPerformanceLog	18	Updated	Admin	2026-08-24 15:14:40.918595	\N
105	SkillAssessment	71	Created	Admin	2026-08-24 15:14:40.935078	\N
106	SkillAssessment	72	Created	Admin	2026-08-24 15:14:40.979608	\N
107	OperatorPerformanceLog	19	Created	Admin	2026-08-24 15:16:00.982277	\N
108	SkillAssessment	73	Created	Admin	2026-08-24 15:16:01.00836	\N
109	SkillAssessment	74	Created	Admin	2026-08-24 15:16:01.047673	\N
110	OperatorPerformanceLog	20	Created	Admin	2026-08-24 15:30:06.758532	\N
111	SkillAssessment	75	Created	Admin	2026-08-24 15:30:06.858694	\N
112	SkillAssessment	76	Created	Admin	2026-08-24 15:30:06.981207	\N
113	AttendanceRecord	11	Created	Admin	2026-08-24 15:44:13.909729	\N
114	AttendanceRecord	12	Created	Admin	2026-08-24 15:44:13.926414	\N
115	Order	3	Created	Admin	2026-08-24 15:53:16.75494	\N
116	SkillAssessment	77	Created	Admin	2026-08-24 15:54:25.657834	\N
117	PieceProductionLog	2	Created	Admin	2026-08-24 16:48:25.98358	Admin created PieceProductionLog #2
118	PieceProductionLog	2	Deleted	Admin	2026-08-24 16:49:43.601575	Admin deleted PieceProductionLog #2
119	PieceProductionLog	3	Created	Admin	2026-08-24 17:39:27.235685	Admin created PieceProductionLog #3
120	PieceProductionLog	4	Created	Admin	2026-08-24 17:40:30.556337	Admin created PieceProductionLog #4
121	PieceProductionLog	5	Created	Admin	2026-08-24 17:56:38.369045	Admin created PieceProductionLog #5
122	LinePlan	1	Created	Admin	2026-08-25 10:56:10.141364	Admin created LinePlan #1
123	LinePlanAssignment	1	Created	Admin	2026-08-25 10:56:10.162071	Admin created LinePlanAssignment #1
124	LinePlan	2	Created	Admin	2026-08-25 11:05:42.858879	Admin created LinePlan #2
125	LinePlanAssignment	2	Created	Admin	2026-08-25 11:05:42.872709	Admin created LinePlanAssignment #2
126	LinePlan	3	Created	Admin	2026-08-25 11:07:23.294903	Admin created LinePlan #3
127	LinePlanAssignment	3	Created	Admin	2026-08-25 11:07:23.298518	Admin created LinePlanAssignment #3
128	LinePlan	1	Updated	Admin	2026-08-25 11:08:11.342683	Admin updated LinePlan #1
129	LinePlan	1	Updated	Admin	2026-08-25 11:08:12.27765	Admin updated LinePlan #1
130	LinePlan	1	Updated	Admin	2026-08-25 11:08:13.422662	Admin updated LinePlan #1
131	LinePlan	1	Updated	Admin	2026-08-25 11:08:14.657855	Admin updated LinePlan #1
132	LinePlan	4	Created	Admin	2026-08-25 12:34:23.459968	Admin created LinePlan #4
133	LinePlanAssignment	4	Created	Admin	2026-08-25 12:34:23.489193	Admin created LinePlanAssignment #4
134	LinePlanAssignment	5	Created	Admin	2026-08-25 12:34:23.499595	Admin created LinePlanAssignment #5
135	LinePlanAssignment	6	Created	Admin	2026-08-25 12:34:23.505588	Admin created LinePlanAssignment #6
136	LinePlanAssignment	7	Created	Admin	2026-08-25 12:34:23.510834	Admin created LinePlanAssignment #7
137	LinePlanAssignment	8	Created	Admin	2026-08-25 12:34:23.517912	Admin created LinePlanAssignment #8
138	Style	1	Updated	Admin	2026-08-25 15:26:52.189827	Admin updated Style ST-001 (T-Shirt · Buyer: vijay traders)
139	Style	1	Updated	Admin	2026-08-25 15:26:53.856682	Admin updated Style ST-001 (T-Shirt · Buyer: vijay traders)
140	LinePlanAssignment	9	Created	Admin	2026-08-25 17:57:10.352096	Admin created LinePlanAssignment #9
141	LinePlanAssignment	10	Created	Admin	2026-08-25 17:57:10.363546	Admin created LinePlanAssignment #10
142	LinePlanAssignment	11	Created	Admin	2026-08-25 17:57:10.368825	Admin created LinePlanAssignment #11
143	LinePlanAssignment	12	Created	Admin	2026-08-25 17:57:10.374154	Admin created LinePlanAssignment #12
144	LinePlanAssignment	13	Created	Admin	2026-08-25 17:57:10.384283	Admin created LinePlanAssignment #13
145	LinePlanAssignment	14	Created	Admin	2026-08-25 17:57:10.384283	Admin created LinePlanAssignment #14
146	LinePlanAssignment	4	Deleted	Admin	2026-08-25 17:57:10.432139	Admin deleted LinePlanAssignment #4
147	LinePlanAssignment	5	Deleted	Admin	2026-08-25 17:57:10.432139	Admin deleted LinePlanAssignment #5
148	LinePlanAssignment	6	Deleted	Admin	2026-08-25 17:57:10.432139	Admin deleted LinePlanAssignment #6
149	LinePlanAssignment	7	Deleted	Admin	2026-08-25 17:57:10.448186	Admin deleted LinePlanAssignment #7
150	LinePlanAssignment	8	Deleted	Admin	2026-08-25 17:57:10.452842	Admin deleted LinePlanAssignment #8
151	Operation	1	Updated	Admin	2026-08-26 10:11:43.889699	Admin updated Operation OP-001 (Shoulder Join)
152	Operation	1	Updated	Admin	2026-08-26 10:11:56.161098	Admin updated Operation OP-001 (Shoulder Join)
153	Shift	1	UPDATED	Admin	2026-08-26 10:12:15.084131	Admin paused Shift #1 (A Shift)
154	Shift	1	Updated	Admin	2026-08-26 10:12:15.088927	Admin updated Shift A (A Shift · 07:00–15:00)
155	Shift	1	UPDATED	Admin	2026-08-26 10:12:18.233803	Admin activated Shift #1 (A Shift)
156	Shift	1	Updated	Admin	2026-08-26 10:12:18.248218	Admin updated Shift A (A Shift · 07:00–15:00)
157	Operation	1	Updated	Admin	2026-08-26 10:24:56.825653	Admin updated Operation OP-001 (Shoulder Join)
158	Operation	1	Updated	Admin	2026-08-26 10:32:45.243428	Admin updated Operation OP-001 (Shoulder Join)
159	PieceProductionLog	6	Created	Admin	2026-08-26 10:46:41.670332	Admin created PieceProductionLog #6
160	PieceProductionLog	7	Created	Admin	2026-08-26 10:47:47.785436	Admin created PieceProductionLog #7
161	Operator	5	Updated	Admin	2026-08-26 17:42:19.920097	Admin updated Operator EMP-1005 (Anita Singh · Sewing Dept)
162	Operator	5	Updated	Admin	2026-08-26 17:42:21.057158	Admin updated Operator EMP-1005 (Anita Singh · Sewing Dept)
163	LinePlan	4	Updated	Admin	2026-08-26 17:47:07.734584	Admin updated LinePlan #4
164	LinePlan	4	Updated	Admin	2026-08-26 17:47:08.438351	Admin updated LinePlan #4
165	LinePlan	4	Updated	Admin	2026-08-26 17:47:10.067291	Admin updated LinePlan #4
166	LinePlan	4	Updated	Admin	2026-08-26 17:47:13.969237	Admin updated LinePlan #4
167	SewingLine	5	Created	Admin	2026-08-27 10:28:44.944902	Admin created SewingLine #5
168	PieceProductionLog	8	Created	Admin	2026-08-27 12:27:59.203768	Admin created PieceProductionLog #8
169	PieceProductionLog	8	Deleted	Admin	2026-08-27 12:36:32.874575	Admin deleted PieceProductionLog #8
170	PieceProductionLog	9	Created	Admin	2026-08-27 12:37:05.269193	Admin created PieceProductionLog #9
171	PieceProductionLog	9	Updated	Admin	2026-08-27 12:42:31.637841	Updated PieceProductionLog #9
172	SewingLine	6	Created	Admin	2026-08-27 16:37:46.910723	Created SewingLine #6
173	SewingLine	6	Updated	Admin	2026-08-27 16:37:51.511576	Updated SewingLine #6
174	SewingLine	6	Deleted	Admin	2026-08-27 16:46:51.081443	Deleted SewingLine #6
175	SewingLine	5	Deleted	Admin	2026-08-27 17:02:41.27117	Deleted SewingLine #5
176	LinePlan	4	Updated	Admin	2026-08-28 09:55:38.937395	Updated LinePlan #4
177	LinePlan	4	Updated	Admin	2026-08-28 09:55:41.363906	Updated LinePlan #4
178	LinePlan	4	Updated	Admin	2026-08-28 09:55:43.079807	Updated LinePlan #4
179	LinePlan	4	Updated	Admin	2026-08-28 09:55:45.460801	Updated LinePlan #4
180	LinePlan	4	Updated	Admin	2026-08-28 09:55:46.34744	Updated LinePlan #4
181	LinePlan	4	Updated	Admin	2026-08-28 09:55:47.288554	Updated LinePlan #4
182	LinePlan	4	Updated	Admin	2026-08-28 09:55:56.675938	Updated LinePlan #4
183	LinePlan	4	Updated	Admin	2026-08-28 09:56:17.793832	Updated LinePlan #4
184	OperatorPerformanceLog	21	Created	Admin	2026-08-31 13:13:52.135452	Created Performance Timing Test (34s · SUBMITTED)
185	SkillAssessment	88	Created	Admin	2026-08-31 13:13:52.300757	Created Skill Rating 2 (Avg Cycle Time: 31s)
186	SkillAssessment	89	Created	Admin	2026-08-31 13:13:52.469309	Created Skill Rating 3 (Avg Cycle Time: 34s)
187	OperatorPerformanceLog	22	Created	Admin	2026-08-31 15:11:13.95391	Created Performance Timing Test (34s · SUBMITTED)
188	SkillAssessment	90	Created	Admin	2026-08-31 15:11:14.10346	Created Skill Rating 4 (Avg Cycle Time: 32s)
189	SkillAssessment	91	Created	Admin	2026-08-31 15:11:14.236928	Created Skill Rating 3 (Avg Cycle Time: 34s)
190	OperatorPerformanceLog	23	Created	Admin	2026-08-31 15:11:58.148679	Created Performance Timing Test (36s · SUBMITTED)
191	SkillAssessment	92	Created	Admin	2026-08-31 15:11:58.177735	Created Skill Rating 3 (Avg Cycle Time: 32s)
192	SkillAssessment	93	Created	Admin	2026-08-31 15:11:58.202422	Created Skill Rating 3 (Avg Cycle Time: 36s)
193	Order	5	Updated	Admin	2026-08-31 15:29:46.832329	Updated Order PO-TSHIRT-480 (Buyer: Zara Men Global · Qty: 480 pcs · Status: PLANNED)
194	Order	5	Updated	Admin	2026-08-31 15:30:05.406115	Updated Order PO-TSHIRT-480 (Buyer: Zara Men · Qty: 480 pcs · Status: PLANNED)
195	Order	5	Updated	Admin	2026-08-31 15:31:34.497977	Updated Order PO-TSHIRT-480 (Buyer: Zara Men · Qty: 3000 pcs · Status: PLANNED)
196	Order	5	Updated	Admin	2026-09-01 10:34:54.789962	Updated Order PO-TSHIRT-480 (Buyer: Zara Men · Qty: 4800 pcs · Status: PLANNED)
197	PieceProductionLog	10	Created	Admin	2026-09-01 15:39:34.786503	Created PieceProductionLog #10
198	AttendanceRecord	13	Created	Admin	2026-09-01 16:00:52.796717	Created Attendance Record (LATE on 2026-09-01)
199	PieceProductionLog	10	Deleted	Admin	2026-09-01 16:36:23.79449	Deleted PieceProductionLog #10
200	LinePlanAssignment	15	Created	Admin	2026-09-01 16:38:39.713309	Created LinePlanAssignment #15
201	LinePlanAssignment	16	Created	Admin	2026-09-01 16:38:39.714997	Created LinePlanAssignment #16
202	LinePlanAssignment	17	Created	Admin	2026-09-01 16:38:39.714997	Created LinePlanAssignment #17
203	LinePlanAssignment	18	Created	Admin	2026-09-01 16:38:39.714997	Created LinePlanAssignment #18
204	LinePlanAssignment	19	Created	Admin	2026-09-01 16:38:39.714997	Created LinePlanAssignment #19
205	LinePlan	4	Updated	Admin	2026-09-01 16:38:39.748244	Updated LinePlan #4
206	LinePlanAssignment	9	Deleted	Admin	2026-09-01 16:38:39.754971	Deleted LinePlanAssignment #9
207	LinePlanAssignment	10	Deleted	Admin	2026-09-01 16:38:39.754971	Deleted LinePlanAssignment #10
208	LinePlanAssignment	11	Deleted	Admin	2026-09-01 16:38:39.761334	Deleted LinePlanAssignment #11
209	LinePlanAssignment	12	Deleted	Admin	2026-09-01 16:38:39.763229	Deleted LinePlanAssignment #12
210	LinePlanAssignment	13	Deleted	Admin	2026-09-01 16:38:39.765023	Deleted LinePlanAssignment #13
211	LinePlanAssignment	14	Deleted	Admin	2026-09-01 16:38:39.765023	Deleted LinePlanAssignment #14
212	LinePlan	4	Updated	Admin	2026-09-01 16:38:46.315246	Updated LinePlan #4
213	LinePlan	4	Updated	Admin	2026-09-01 16:38:56.16853	Updated LinePlan #4
214	LinePlan	4	Updated	Admin	2026-09-01 16:38:57.809587	Updated LinePlan #4
215	LinePlan	4	Updated	Admin	2026-09-01 16:39:09.295255	Updated LinePlan #4
216	LinePlan	4	Updated	Admin	2026-09-01 16:39:10.992085	Updated LinePlan #4
217	LinePlan	4	Updated	Admin	2026-09-01 16:39:11.925658	Updated LinePlan #4
218	LinePlan	4	Updated	Admin	2026-09-01 16:39:12.661447	Updated LinePlan #4
219	LinePlan	4	Updated	Admin	2026-09-01 16:39:14.376116	Updated LinePlan #4
220	LinePlan	4	Updated	Admin	2026-09-01 16:39:16.591278	Updated LinePlan #4
221	LinePlanAssignment	20	Created	Admin	2026-09-01 16:51:45.545954	Created LinePlanAssignment #20
222	LinePlanAssignment	21	Created	Admin	2026-09-01 16:51:45.545954	Created LinePlanAssignment #21
223	LinePlanAssignment	22	Created	Admin	2026-09-01 16:51:45.545954	Created LinePlanAssignment #22
224	LinePlanAssignment	23	Created	Admin	2026-09-01 16:51:45.545954	Created LinePlanAssignment #23
225	LinePlanAssignment	24	Created	Admin	2026-09-01 16:51:45.561644	Created LinePlanAssignment #24
226	LinePlan	4	Updated	Admin	2026-09-01 16:51:45.561644	Updated LinePlan #4
227	LinePlanAssignment	15	Deleted	Admin	2026-09-01 16:51:45.561644	Deleted LinePlanAssignment #15
228	LinePlanAssignment	16	Deleted	Admin	2026-09-01 16:51:45.561644	Deleted LinePlanAssignment #16
229	LinePlanAssignment	17	Deleted	Admin	2026-09-01 16:51:45.561644	Deleted LinePlanAssignment #17
230	LinePlanAssignment	18	Deleted	Admin	2026-09-01 16:51:45.578076	Deleted LinePlanAssignment #18
231	LinePlanAssignment	19	Deleted	Admin	2026-09-01 16:51:45.578076	Deleted LinePlanAssignment #19
232	PieceProductionLog	11	Created	Admin	2026-09-01 17:22:15.275924	Created PieceProductionLog #11
233	PieceProductionLog	12	Created	Admin	2026-09-01 17:23:29.818848	Created PieceProductionLog #12
234	PieceProductionLog	13	Created	Admin	2026-09-01 17:23:47.560068	Created PieceProductionLog #13
235	PieceProductionLog	14	Created	Admin	2026-09-01 17:24:11.77973	Created PieceProductionLog #14
236	PieceProductionLog	15	Created	Admin	2026-09-01 17:25:53.670388	Created PieceProductionLog #15
237	PieceProductionLog	13	Updated	Admin	2026-09-01 18:06:09.703749	Updated PieceProductionLog #13
238	PieceProductionLog	15	Updated	Admin	2026-09-01 18:06:22.674557	Updated PieceProductionLog #15
239	PieceProductionLog	14	Updated	Admin	2026-09-01 18:06:35.442971	Updated PieceProductionLog #14
240	PieceProductionLog	16	Created	Admin	2026-09-01 18:07:39.44828	Created PieceProductionLog #16
241	PieceProductionLog	17	Created	Admin	2026-09-01 18:08:35.157396	Created PieceProductionLog #17
242	PieceProductionLog	16	Deleted	Admin	2026-09-01 18:09:16.941266	Deleted PieceProductionLog #16
243	PieceProductionLog	18	Created	Admin	2026-09-01 18:18:49.955867	Created PieceProductionLog #18
244	PieceProductionLog	19	Created	Admin	2026-09-01 18:19:40.323126	Created PieceProductionLog #19
245	PieceProductionLog	20	Created	Admin	2026-09-01 18:20:09.171011	Created PieceProductionLog #20
1467	OperatorPerformanceLog	26	Created	Admin	2026-09-10 16:45:31.657977	Created Performance Timing Test (25s · SUBMITTED)
1468	SkillAssessment	2943	Created	Admin	2026-09-10 16:45:31.676441	Created Skill Rating 5 (Avg Cycle Time: 25s)
1469	OperatorPerformanceLog	27	Created	Admin	2026-09-10 16:45:31.684473	Created Performance Timing Test (23s · SUBMITTED)
1470	SkillAssessment	2944	Created	Admin	2026-09-10 16:45:31.687676	Created Skill Rating 5 (Avg Cycle Time: 24s)
1471	OperatorPerformanceLog	28	Created	Admin	2026-09-10 16:45:31.691824	Created Performance Timing Test (40s · SUBMITTED)
1472	SkillAssessment	2945	Created	Admin	2026-09-10 16:45:31.695497	Created Skill Rating 5 (Avg Cycle Time: 40s)
1473	OperatorPerformanceLog	29	Created	Admin	2026-09-10 16:45:31.699639	Created Performance Timing Test (38s · SUBMITTED)
1474	SkillAssessment	2946	Created	Admin	2026-09-10 16:45:31.706091	Created Skill Rating 5 (Avg Cycle Time: 39s)
1475	OperatorPerformanceLog	30	Created	Admin	2026-09-10 16:45:31.709402	Created Performance Timing Test (26s · SUBMITTED)
1476	SkillAssessment	2947	Created	Admin	2026-09-10 16:45:31.712989	Created Skill Rating 5 (Avg Cycle Time: 26s)
1477	OperatorPerformanceLog	31	Created	Admin	2026-09-10 16:45:31.718923	Created Performance Timing Test (24s · SUBMITTED)
1478	SkillAssessment	2948	Created	Admin	2026-09-10 16:45:31.722129	Created Skill Rating 5 (Avg Cycle Time: 25s)
1481	OperatorPerformanceLog	33	Created	Admin	2026-09-10 16:45:31.742284	Created Performance Timing Test (52s · SUBMITTED)
1482	SkillAssessment	2950	Created	Admin	2026-09-10 16:45:31.74555	Created Skill Rating 2 (Avg Cycle Time: 53s)
1487	OperatorPerformanceLog	36	Created	Admin	2026-09-10 16:45:31.785847	Created Performance Timing Test (40s · SUBMITTED)
1488	SkillAssessment	2953	Created	Admin	2026-09-10 16:45:31.789118	Created Skill Rating 5 (Avg Cycle Time: 40s)
1489	OperatorPerformanceLog	37	Created	Admin	2026-09-10 16:45:31.793804	Created Performance Timing Test (38s · SUBMITTED)
1490	SkillAssessment	2954	Created	Admin	2026-09-10 16:45:31.798699	Created Skill Rating 5 (Avg Cycle Time: 39s)
1491	OperatorPerformanceLog	38	Created	Admin	2026-09-10 16:45:31.801888	Created Performance Timing Test (22s · SUBMITTED)
1492	SkillAssessment	2955	Created	Admin	2026-09-10 16:45:31.805525	Created Skill Rating 5 (Avg Cycle Time: 22s)
1493	OperatorPerformanceLog	39	Created	Admin	2026-09-10 16:45:31.808091	Created Performance Timing Test (20s · SUBMITTED)
1494	SkillAssessment	2956	Created	Admin	2026-09-10 16:45:31.811297	Created Skill Rating 5 (Avg Cycle Time: 21s)
1495	OperatorPerformanceLog	40	Created	Admin	2026-09-10 16:45:31.818009	Created Performance Timing Test (55s · SUBMITTED)
1496	SkillAssessment	2957	Created	Admin	2026-09-10 16:45:31.820597	Created Skill Rating 1 (Avg Cycle Time: 55s)
1497	OperatorPerformanceLog	41	Created	Admin	2026-09-10 16:45:31.824252	Created Performance Timing Test (53s · SUBMITTED)
1498	SkillAssessment	2958	Created	Admin	2026-09-10 16:45:31.827853	Created Skill Rating 2 (Avg Cycle Time: 54s)
1501	OperatorPerformanceLog	43	Created	Admin	2026-09-10 16:45:31.840901	Created Performance Timing Test (27s · SUBMITTED)
1502	SkillAssessment	2960	Created	Admin	2026-09-10 16:45:31.846397	Created Skill Rating 5 (Avg Cycle Time: 28s)
1507	OperatorPerformanceLog	46	Created	Admin	2026-09-10 16:45:31.869345	Created Performance Timing Test (31s · SUBMITTED)
1508	SkillAssessment	2963	Created	Admin	2026-09-10 16:45:31.872501	Created Skill Rating 5 (Avg Cycle Time: 31s)
1509	OperatorPerformanceLog	47	Created	Admin	2026-09-10 16:45:31.875659	Created Performance Timing Test (29s · SUBMITTED)
1510	SkillAssessment	2964	Created	Admin	2026-09-10 16:45:31.878804	Created Skill Rating 5 (Avg Cycle Time: 30s)
1511	OperatorPerformanceLog	48	Created	Admin	2026-09-10 16:45:31.884103	Created Performance Timing Test (45s · SUBMITTED)
1512	SkillAssessment	2965	Created	Admin	2026-09-10 16:45:31.886621	Created Skill Rating 3 (Avg Cycle Time: 45s)
1513	OperatorPerformanceLog	49	Created	Admin	2026-09-10 16:45:31.88989	Created Performance Timing Test (43s · SUBMITTED)
1514	SkillAssessment	2966	Created	Admin	2026-09-10 16:45:31.893057	Created Skill Rating 3 (Avg Cycle Time: 44s)
1515	OperatorPerformanceLog	50	Created	Admin	2026-09-10 16:45:31.897736	Created Performance Timing Test (29s · SUBMITTED)
1516	SkillAssessment	2967	Created	Admin	2026-09-10 16:45:31.902315	Created Skill Rating 5 (Avg Cycle Time: 29s)
1517	OperatorPerformanceLog	51	Created	Admin	2026-09-10 16:45:31.905442	Created Performance Timing Test (27s · SUBMITTED)
1518	SkillAssessment	2968	Created	Admin	2026-09-10 16:45:31.908609	Created Skill Rating 5 (Avg Cycle Time: 28s)
1521	OperatorPerformanceLog	53	Created	Admin	2026-09-10 16:45:31.922204	Created Performance Timing Test (38s · SUBMITTED)
1522	SkillAssessment	2970	Created	Admin	2026-09-10 16:45:31.925504	Created Skill Rating 5 (Avg Cycle Time: 39s)
1527	OperatorPerformanceLog	56	Created	Admin	2026-09-10 16:45:31.946051	Created Performance Timing Test (46s · SUBMITTED)
1528	SkillAssessment	2973	Created	Admin	2026-09-10 16:45:31.950147	Created Skill Rating 3 (Avg Cycle Time: 46s)
1529	OperatorPerformanceLog	57	Created	Admin	2026-09-10 16:45:31.955521	Created Performance Timing Test (44s · SUBMITTED)
1530	SkillAssessment	2974	Created	Admin	2026-09-10 16:45:31.959648	Created Skill Rating 3 (Avg Cycle Time: 45s)
1531	OperatorPerformanceLog	58	Created	Admin	2026-09-10 16:45:31.964382	Created Performance Timing Test (26s · SUBMITTED)
1532	SkillAssessment	2975	Created	Admin	2026-09-10 16:45:31.969284	Created Skill Rating 5 (Avg Cycle Time: 26s)
1533	OperatorPerformanceLog	59	Created	Admin	2026-09-10 16:45:31.972542	Created Performance Timing Test (24s · SUBMITTED)
1534	SkillAssessment	2976	Created	Admin	2026-09-10 16:45:31.977367	Created Skill Rating 5 (Avg Cycle Time: 25s)
1535	OperatorPerformanceLog	60	Created	Admin	2026-09-10 16:45:31.982141	Created Performance Timing Test (40s · SUBMITTED)
1536	SkillAssessment	2977	Created	Admin	2026-09-10 16:45:31.98594	Created Skill Rating 5 (Avg Cycle Time: 40s)
1537	OperatorPerformanceLog	61	Created	Admin	2026-09-10 16:45:31.990721	Created Performance Timing Test (38s · SUBMITTED)
1538	SkillAssessment	2978	Created	Admin	2026-09-10 16:45:31.993862	Created Skill Rating 5 (Avg Cycle Time: 39s)
1541	OperatorPerformanceLog	63	Created	Admin	2026-09-10 16:45:32.006905	Created Performance Timing Test (24s · SUBMITTED)
1542	SkillAssessment	2980	Created	Admin	2026-09-10 16:45:32.011111	Created Skill Rating 5 (Avg Cycle Time: 25s)
1547	OperatorPerformanceLog	66	Created	Admin	2026-09-10 16:45:32.03541	Created Performance Timing Test (22s · SUBMITTED)
1548	SkillAssessment	2983	Created	Admin	2026-09-10 16:45:32.038632	Created Skill Rating 5 (Avg Cycle Time: 22s)
1549	OperatorPerformanceLog	67	Created	Admin	2026-09-10 16:45:32.041866	Created Performance Timing Test (20s · SUBMITTED)
246	PieceProductionLog	21	Created	Admin	2026-09-01 18:20:47.614482	Created PieceProductionLog #21
247	PieceProductionLog	22	Created	Admin	2026-09-01 18:21:04.961076	Created PieceProductionLog #22
248	PieceProductionLog	17	Updated	Admin	2026-09-01 18:21:36.495437	Updated PieceProductionLog #17
249	PieceProductionLog	23	Created	Admin	2026-09-01 18:21:55.406828	Created PieceProductionLog #23
250	PieceProductionLog	18	Deleted	Admin	2026-09-01 18:22:41.758357	Deleted PieceProductionLog #18
251	PieceProductionLog	20	Deleted	Admin	2026-09-01 18:22:50.575052	Deleted PieceProductionLog #20
252	AttendanceRecord	14	Created	Admin	2026-09-01 18:48:20.092733	Created Attendance Record (LATE on 2026-09-01)
253	AttendanceRecord	15	Created	Admin	2026-09-02 09:35:24.301141	Created Attendance Record (LATE on 2026-09-02)
254	Notification	1	Created	Admin	2026-09-02 09:35:24.348739	Created Notification #1
255	AttendanceRecord	16	Created	Admin	2026-09-02 09:35:54.350767	Created Attendance Record (LATE on 2026-09-02)
256	Notification	2	Created	Admin	2026-09-02 09:35:54.362293	Created Notification #2
257	AttendanceRecord	17	Created	Admin	2026-09-02 09:35:54.389593	Created Attendance Record (LATE on 2026-09-02)
258	Notification	3	Created	Admin	2026-09-02 09:35:54.405691	Created Notification #3
259	AttendanceRecord	18	Created	Admin	2026-09-02 09:35:54.434111	Created Attendance Record (LATE on 2026-09-02)
260	Notification	4	Created	Admin	2026-09-02 09:35:54.446779	Created Notification #4
261	AttendanceRecord	19	Created	Admin	2026-09-02 09:40:40.129724	Created Attendance Record (LATE on 2026-09-02)
262	Notification	5	Created	Admin	2026-09-02 09:40:40.129724	Created Notification #5
263	Notification	1	Updated	Admin	2026-09-02 09:45:51.477841	Updated Notification #1
264	Notification	3	Updated	Admin	2026-09-02 09:45:56.51349	Updated Notification #3
265	Notification	4	Updated	Admin	2026-09-02 09:46:26.589888	Updated Notification #4
266	Notification	5	Updated	Admin	2026-09-02 09:46:48.067728	Updated Notification #5
267	AttendanceRecord	20	Created	Admin	2026-09-02 09:57:08.815441	Created Attendance Record (LATE on 2026-09-02)
268	Notification	6	Created	Admin	2026-09-02 09:57:08.817857	Created Notification #6
269	PieceProductionLog	9	Deleted	Admin	2026-09-02 10:45:55.183965	Deleted PieceProductionLog #9
270	PieceProductionLog	6	Deleted	Admin	2026-09-02 10:46:02.633389	Deleted PieceProductionLog #6
271	PieceProductionLog	7	Deleted	Admin	2026-09-02 10:46:16.177721	Deleted PieceProductionLog #7
272	PieceProductionLog	1	Deleted	Admin	2026-09-02 10:46:23.832031	Deleted PieceProductionLog #1
273	PieceProductionLog	3	Deleted	Admin	2026-09-02 10:46:36.398013	Deleted PieceProductionLog #3
274	PieceProductionLog	4	Deleted	Admin	2026-09-02 10:46:46.929347	Deleted PieceProductionLog #4
275	PieceProductionLog	22	Updated	Admin	2026-09-02 10:49:33.199484	Updated PieceProductionLog #22
276	PieceProductionLog	21	Updated	Admin	2026-09-02 10:50:07.103884	Updated PieceProductionLog #21
277	PieceProductionLog	19	Updated	Admin	2026-09-02 11:04:24.11598	Updated PieceProductionLog #19
278	PieceProductionLog	21	Updated	Admin	2026-09-02 11:05:04.954169	Updated PieceProductionLog #21
279	PieceProductionLog	24	Created	Admin	2026-09-02 11:23:41.424887	Created PieceProductionLog #24
280	PieceProductionLog	25	Created	Admin	2026-09-02 11:24:05.129996	Created PieceProductionLog #25
281	PieceProductionLog	26	Created	Admin	2026-09-02 11:24:20.761262	Created PieceProductionLog #26
282	PieceProductionLog	27	Created	Admin	2026-09-02 11:24:34.225027	Created PieceProductionLog #27
283	PieceProductionLog	28	Created	Admin	2026-09-02 11:25:08.755718	Created PieceProductionLog #28
284	Notification	6	Updated	Admin	2026-09-02 12:08:55.45542	Updated Notification #6
285	Order	5	Updated	Admin	2026-09-02 12:11:46.72526	Updated Order PO-TSHIRT-480 (Buyer: Zara Men · Qty: 4800 pcs · Status: PLANNED)
286	Notification	7	Created	Admin	2026-09-02 12:26:56.452789	Created Notification #7
287	Notification	8	Created	Admin	2026-09-02 12:28:30.942903	Created Notification #8
288	Notification	9	Created	Admin	2026-09-02 12:32:49.176528	Created Notification #9
289	Notification	10	Created	Admin	2026-09-02 12:32:49.548829	Created Notification #10
290	Notification	10	Updated	Admin	2026-09-02 12:35:09.874235	Updated Notification #10
291	Notification	9	Updated	Admin	2026-09-02 12:35:20.438682	Updated Notification #9
292	Notification	11	Created	Admin	2026-09-02 12:35:23.83727	Created Notification #11
293	Notification	12	Created	Admin	2026-09-02 12:35:29.153076	Created Notification #12
294	Notification	13	Created	Admin	2026-09-02 12:41:15.036213	Created Notification #13
295	Notification	14	Created	Admin	2026-09-02 12:41:15.347652	Created Notification #14
296	Notification	13	Updated	Admin	2026-09-02 12:42:39.026387	Updated Notification #13
297	Notification	15	Created	Admin	2026-09-02 12:43:18.377412	Created Notification #15
298	Notification	16	Created	Admin	2026-09-02 12:43:18.804176	Created Notification #16
299	Notification	17	Created	Admin	2026-09-02 12:43:20.403442	Created Notification #17
300	Notification	18	Created	Admin	2026-09-02 12:44:46.637611	Created Notification #18
301	Notification	18	Updated	Admin	2026-09-02 12:46:32.284408	Updated Notification #18
302	Notification	19	Created	Admin	2026-09-02 12:46:32.548273	Created Notification #19
303	Notification	20	Created	Admin	2026-09-02 12:46:32.943961	Created Notification #20
304	Notification	21	Created	Admin	2026-09-02 12:46:33.074451	Created Notification #21
305	Notification	21	Updated	Admin	2026-09-02 12:47:36.080231	Updated Notification #21
306	Notification	22	Created	Admin	2026-09-02 12:47:48.165674	Created Notification #22
307	Notification	23	Created	Admin	2026-09-02 12:47:48.476039	Created Notification #23
308	Notification	24	Created	Admin	2026-09-02 12:47:48.548183	Created Notification #24
309	Notification	25	Created	Admin	2026-09-02 12:47:48.630051	Created Notification #25
310	Notification	26	Created	Admin	2026-09-02 12:48:37.269525	Created Notification #26
311	Notification	27	Created	Admin	2026-09-02 12:48:37.318206	Created Notification #27
312	Notification	28	Created	Admin	2026-09-02 12:48:37.380425	Created Notification #28
313	Notification	27	Updated	Admin	2026-09-02 12:49:17.335135	Updated Notification #27
314	Notification	29	Created	Admin	2026-09-02 12:49:57.089446	Created Notification #29
315	Notification	30	Created	Admin	2026-09-02 12:49:57.150393	Created Notification #30
316	Notification	31	Created	Admin	2026-09-02 12:51:47.247445	Created Notification #31
317	Notification	32	Created	Admin	2026-09-02 12:51:47.299464	Created Notification #32
318	Notification	33	Created	Admin	2026-09-02 12:51:49.76745	Created Notification #33
319	Notification	34	Created	Admin	2026-09-02 12:51:51.623711	Created Notification #34
1479	OperatorPerformanceLog	32	Created	Admin	2026-09-10 16:45:31.72772	Created Performance Timing Test (54s · SUBMITTED)
1480	SkillAssessment	2949	Created	Admin	2026-09-10 16:45:31.736803	Created Skill Rating 2 (Avg Cycle Time: 54s)
1485	OperatorPerformanceLog	35	Created	Admin	2026-09-10 16:45:31.775953	Created Performance Timing Test (28s · SUBMITTED)
1486	SkillAssessment	2952	Created	Admin	2026-09-10 16:45:31.780932	Created Skill Rating 5 (Avg Cycle Time: 29s)
1499	OperatorPerformanceLog	42	Created	Admin	2026-09-10 16:45:31.833113	Created Performance Timing Test (29s · SUBMITTED)
1500	SkillAssessment	2959	Created	Admin	2026-09-10 16:45:31.837767	Created Skill Rating 5 (Avg Cycle Time: 29s)
1505	OperatorPerformanceLog	45	Created	Admin	2026-09-10 16:45:31.859486	Created Performance Timing Test (38s · SUBMITTED)
1506	SkillAssessment	2962	Created	Admin	2026-09-10 16:45:31.864235	Created Skill Rating 5 (Avg Cycle Time: 39s)
1519	OperatorPerformanceLog	52	Created	Admin	2026-09-10 16:45:31.912741	Created Performance Timing Test (40s · SUBMITTED)
1520	SkillAssessment	2969	Created	Admin	2026-09-10 16:45:31.919046	Created Skill Rating 5 (Avg Cycle Time: 40s)
1525	OperatorPerformanceLog	55	Created	Admin	2026-09-10 16:45:31.939659	Created Performance Timing Test (24s · SUBMITTED)
1526	SkillAssessment	2972	Created	Admin	2026-09-10 16:45:31.942936	Created Skill Rating 5 (Avg Cycle Time: 25s)
1539	OperatorPerformanceLog	62	Created	Admin	2026-09-10 16:45:31.999087	Created Performance Timing Test (26s · SUBMITTED)
1540	SkillAssessment	2979	Created	Admin	2026-09-10 16:45:32.003788	Created Skill Rating 5 (Avg Cycle Time: 26s)
1545	OperatorPerformanceLog	65	Created	Admin	2026-09-10 16:45:32.026736	Created Performance Timing Test (44s · SUBMITTED)
1546	SkillAssessment	2982	Created	Admin	2026-09-10 16:45:32.030395	Created Skill Rating 3 (Avg Cycle Time: 45s)
1559	OperatorPerformanceLog	72	Created	Admin	2026-09-10 16:45:32.106001	Created Performance Timing Test (39s · SUBMITTED)
1560	SkillAssessment	2989	Created	Admin	2026-09-10 16:45:32.111198	Created Skill Rating 4 (Avg Cycle Time: 39s)
1565	OperatorPerformanceLog	75	Created	Admin	2026-09-10 16:45:32.157957	Created Performance Timing Test (34s · SUBMITTED)
1566	SkillAssessment	2992	Created	Admin	2026-09-10 16:45:32.17306	Created Skill Rating 3 (Avg Cycle Time: 35s)
1581	OperatorPerformanceLog	83	Created	Admin	2026-09-10 16:45:32.357079	Created Performance Timing Test (24s · SUBMITTED)
1582	SkillAssessment	3000	Created	Admin	2026-09-10 16:45:32.366476	Created Skill Rating 5 (Avg Cycle Time: 25s)
1587	OperatorPerformanceLog	86	Created	Admin	2026-09-10 16:45:32.420622	Created Performance Timing Test (23s · SUBMITTED)
1588	SkillAssessment	3003	Created	Admin	2026-09-10 16:45:32.426807	Created Skill Rating 5 (Avg Cycle Time: 23s)
1601	OperatorPerformanceLog	93	Created	Admin	2026-09-10 16:45:32.557197	Created Performance Timing Test (32s · SUBMITTED)
1602	SkillAssessment	3010	Created	Admin	2026-09-10 16:45:32.565859	Created Skill Rating 5 (Avg Cycle Time: 33s)
1607	OperatorPerformanceLog	96	Created	Admin	2026-09-10 16:45:32.619035	Created Performance Timing Test (45s · SUBMITTED)
1608	SkillAssessment	3013	Created	Admin	2026-09-10 16:45:32.625623	Created Skill Rating 3 (Avg Cycle Time: 45s)
1621	OperatorPerformanceLog	103	Created	Admin	2026-09-10 16:45:32.729761	Created Performance Timing Test (18s · SUBMITTED)
1622	SkillAssessment	3020	Created	Admin	2026-09-10 16:45:32.736516	Created Skill Rating 5 (Avg Cycle Time: 19s)
1627	OperatorPerformanceLog	106	Created	Admin	2026-09-10 16:45:32.770528	Created Performance Timing Test (29s · SUBMITTED)
1628	SkillAssessment	3023	Created	Admin	2026-09-10 16:45:32.775265	Created Skill Rating 5 (Avg Cycle Time: 29s)
1641	OperatorPerformanceLog	113	Created	Admin	2026-09-10 16:45:32.871101	Created Performance Timing Test (52s · SUBMITTED)
1642	SkillAssessment	3030	Created	Admin	2026-09-10 16:45:32.884004	Created Skill Rating 2 (Avg Cycle Time: 53s)
1647	OperatorPerformanceLog	116	Created	Admin	2026-09-10 16:45:32.918591	Created Performance Timing Test (70s · SUBMITTED)
1648	SkillAssessment	3033	Created	Admin	2026-09-10 16:45:32.925582	Created Skill Rating 1 (Avg Cycle Time: 70s)
1661	OperatorPerformanceLog	123	Created	Admin	2026-09-10 16:45:33.009333	Created Performance Timing Test (28s · SUBMITTED)
1662	SkillAssessment	3040	Created	Admin	2026-09-10 16:45:33.017841	Created Skill Rating 5 (Avg Cycle Time: 29s)
1667	OperatorPerformanceLog	126	Created	Admin	2026-09-10 16:45:33.053959	Created Performance Timing Test (31s · SUBMITTED)
1668	SkillAssessment	3043	Created	Admin	2026-09-10 16:45:33.060507	Created Skill Rating 5 (Avg Cycle Time: 31s)
1681	OperatorPerformanceLog	133	Created	Admin	2026-09-10 16:45:33.161826	Created Performance Timing Test (38s · SUBMITTED)
1682	SkillAssessment	3050	Created	Admin	2026-09-10 16:45:33.169719	Created Skill Rating 5 (Avg Cycle Time: 39s)
1687	OperatorPerformanceLog	136	Created	Admin	2026-09-10 16:45:33.204816	Created Performance Timing Test (46s · SUBMITTED)
1688	SkillAssessment	3053	Created	Admin	2026-09-10 16:45:33.209674	Created Skill Rating 3 (Avg Cycle Time: 46s)
1701	OperatorPerformanceLog	143	Created	Admin	2026-09-10 16:45:33.308684	Created Performance Timing Test (24s · SUBMITTED)
1702	SkillAssessment	3060	Created	Admin	2026-09-10 16:45:33.316874	Created Skill Rating 5 (Avg Cycle Time: 25s)
1707	OperatorPerformanceLog	146	Created	Admin	2026-09-10 16:45:33.366041	Created Performance Timing Test (36s · SUBMITTED)
1708	SkillAssessment	3063	Created	Admin	2026-09-10 16:45:33.372976	Created Skill Rating 3 (Avg Cycle Time: 36s)
1721	OperatorPerformanceLog	153	Created	Admin	2026-09-10 16:45:33.495184	Created Performance Timing Test (52s · SUBMITTED)
1722	SkillAssessment	3070	Created	Admin	2026-09-10 16:45:33.505954	Created Skill Rating 2 (Avg Cycle Time: 53s)
1727	OperatorPerformanceLog	156	Created	Admin	2026-09-10 16:45:33.555069	Created Performance Timing Test (33s · SUBMITTED)
1728	SkillAssessment	3073	Created	Admin	2026-09-10 16:45:33.563267	Created Skill Rating 5 (Avg Cycle Time: 33s)
1741	OperatorPerformanceLog	163	Created	Admin	2026-09-10 16:45:33.643412	Created Performance Timing Test (23s · SUBMITTED)
1742	SkillAssessment	3080	Created	Admin	2026-09-10 16:45:33.65215	Created Skill Rating 5 (Avg Cycle Time: 24s)
1747	OperatorPerformanceLog	166	Created	Admin	2026-09-10 16:45:33.682822	Created Performance Timing Test (22s · SUBMITTED)
1748	SkillAssessment	3083	Created	Admin	2026-09-10 16:45:33.688286	Created Skill Rating 5 (Avg Cycle Time: 22s)
1761	OperatorPerformanceLog	173	Created	Admin	2026-09-10 16:45:33.767543	Created Performance Timing Test (45s · SUBMITTED)
1762	SkillAssessment	3090	Created	Admin	2026-09-10 16:45:33.772866	Created Skill Rating 3 (Avg Cycle Time: 46s)
320	Notification	35	Created	Admin	2026-09-02 12:52:27.455822	Created Notification #35
321	Notification	7	Updated	Admin	2026-09-02 12:54:55.330258	Updated Notification #7
322	Notification	8	Deleted	Admin	2026-09-02 12:54:55.35702	Deleted Notification #8
323	Notification	10	Deleted	Admin	2026-09-02 12:54:55.363661	Deleted Notification #10
324	Notification	9	Deleted	Admin	2026-09-02 12:54:55.365665	Deleted Notification #9
325	Notification	13	Deleted	Admin	2026-09-02 12:54:55.369718	Deleted Notification #13
326	Notification	18	Deleted	Admin	2026-09-02 12:54:55.379141	Deleted Notification #18
327	Notification	19	Deleted	Admin	2026-09-02 12:54:55.381734	Deleted Notification #19
328	Notification	27	Deleted	Admin	2026-09-02 12:54:55.388854	Deleted Notification #27
329	Notification	21	Deleted	Admin	2026-09-02 12:54:55.393605	Deleted Notification #21
330	Notification	11	Deleted	Admin	2026-09-02 12:54:55.398102	Deleted Notification #11
331	Notification	12	Deleted	Admin	2026-09-02 12:54:55.400228	Deleted Notification #12
332	Notification	14	Deleted	Admin	2026-09-02 12:54:55.402761	Deleted Notification #14
333	Notification	15	Deleted	Admin	2026-09-02 12:54:55.40487	Deleted Notification #15
334	Notification	16	Deleted	Admin	2026-09-02 12:54:55.40586	Deleted Notification #16
335	Notification	17	Deleted	Admin	2026-09-02 12:54:55.408877	Deleted Notification #17
336	Notification	23	Deleted	Admin	2026-09-02 12:54:55.412904	Deleted Notification #23
337	Notification	20	Deleted	Admin	2026-09-02 12:54:55.415021	Deleted Notification #20
338	Notification	22	Deleted	Admin	2026-09-02 12:54:55.417919	Deleted Notification #22
339	Notification	24	Deleted	Admin	2026-09-02 12:54:55.419957	Deleted Notification #24
340	Notification	25	Deleted	Admin	2026-09-02 12:54:55.422414	Deleted Notification #25
341	Notification	26	Deleted	Admin	2026-09-02 12:54:55.429193	Deleted Notification #26
342	Notification	28	Deleted	Admin	2026-09-02 12:54:55.431757	Deleted Notification #28
343	Notification	30	Deleted	Admin	2026-09-02 12:54:55.434916	Deleted Notification #30
344	Notification	29	Deleted	Admin	2026-09-02 12:54:55.437891	Deleted Notification #29
345	Notification	31	Deleted	Admin	2026-09-02 12:54:55.440779	Deleted Notification #31
346	Notification	32	Deleted	Admin	2026-09-02 12:54:55.444302	Deleted Notification #32
347	Notification	33	Deleted	Admin	2026-09-02 12:54:55.447067	Deleted Notification #33
348	Notification	34	Deleted	Admin	2026-09-02 12:54:55.450146	Deleted Notification #34
349	Notification	35	Deleted	Admin	2026-09-02 12:54:55.45378	Deleted Notification #35
350	OperationBulletin	4	Created	Admin	2026-09-02 15:00:35.329294	Created OperationBulletin #4
351	Notification	7	Updated	Admin	2026-09-02 15:06:28.265141	Updated Notification #7
352	PieceProductionLog	24	Updated	Admin	2026-09-02 16:09:02.011978	Updated PieceProductionLog #24
353	Notification	7	Updated	Admin	2026-09-02 16:26:39.409672	Updated Notification #7
354	Notification	7	Updated	Admin	2026-09-02 17:34:36.324264	Updated Notification #7
355	PieceProductionLog	29	Created	Admin	2026-09-02 17:36:36.249058	Created PieceProductionLog #29
356	PieceProductionLog	30	Created	Admin	2026-09-02 17:36:59.296298	Created PieceProductionLog #30
357	PieceProductionLog	31	Created	Admin	2026-09-02 17:37:12.594083	Created PieceProductionLog #31
358	PieceProductionLog	32	Created	Admin	2026-09-02 17:37:27.957527	Created PieceProductionLog #32
359	PieceProductionLog	33	Created	Admin	2026-09-02 17:37:48.468179	Created PieceProductionLog #33
360	OperatorPerformanceLog	24	Created	Admin	2026-09-02 18:23:08.782107	Created Performance Timing Test (45s · DRAFT)
361	OperatorPerformanceLog	25	Created	Admin	2026-09-02 18:23:32.861528	Created Performance Timing Test (48s · DRAFT)
362	OperatorPerformanceLog	24	Updated	Admin	2026-09-02 18:23:40.035977	Updated Performance Timing Test (45s · SUBMITTED)
363	OperatorPerformanceLog	25	Updated	Admin	2026-09-02 18:23:40.043862	Updated Performance Timing Test (48s · SUBMITTED)
364	SkillAssessment	1120	Created	Admin	2026-09-02 18:23:40.210682	Created Skill Rating 3 (Avg Cycle Time: 47s)
365	SkillAssessment	1121	Created	Admin	2026-09-02 18:23:40.33154	Created Skill Rating 3 (Avg Cycle Time: 47s)
366	SkillAssessment	1122	Created	Admin	2026-09-02 18:23:40.377814	Created Skill Rating 3 (Avg Cycle Time: 32s)
367	Notification	7	Updated	Admin	2026-09-03 10:01:31.096905	Updated Notification #7
368	Notification	7	Updated	Admin	2026-09-03 10:02:08.847203	Updated Notification #7
369	AttendanceRecord	21	Created	Admin	2026-09-03 10:10:01.361842	Created Attendance Record (ON_LEAVE on 2026-09-03)
370	AttendanceRecord	22	Created	Admin	2026-09-03 10:30:49.785483	Created Attendance Record (PRESENT on 2026-09-03)
371	AttendanceRecord	23	Created	Admin	2026-09-03 10:30:49.802242	Created Attendance Record (PRESENT on 2026-09-03)
372	AttendanceRecord	21	Updated	Admin	2026-09-03 10:30:49.819235	Updated Attendance Record (PRESENT on 2026-09-03)
373	AttendanceRecord	24	Created	Admin	2026-09-03 10:30:49.828489	Created Attendance Record (PRESENT on 2026-09-03)
374	AttendanceRecord	25	Created	Admin	2026-09-03 10:30:49.842576	Created Attendance Record (PRESENT on 2026-09-03)
375	AttendanceRecord	26	Created	Admin	2026-09-03 10:30:49.850779	Created Attendance Record (PRESENT on 2026-09-03)
376	AttendanceRecord	27	Created	Admin	2026-09-03 10:30:49.859948	Created Attendance Record (PRESENT on 2026-09-03)
377	AttendanceRecord	28	Created	Admin	2026-09-03 10:30:49.875752	Created Attendance Record (PRESENT on 2026-09-03)
378	AttendanceRecord	29	Created	Admin	2026-09-03 10:30:49.883829	Created Attendance Record (PRESENT on 2026-09-03)
379	AttendanceRecord	30	Created	Admin	2026-09-03 10:30:49.895212	Created Attendance Record (PRESENT on 2026-09-03)
380	AttendanceRecord	31	Created	Admin	2026-09-03 10:30:49.90372	Created Attendance Record (PRESENT on 2026-09-03)
381	AttendanceRecord	32	Created	Admin	2026-09-03 10:30:49.910341	Created Attendance Record (PRESENT on 2026-09-03)
382	AttendanceRecord	33	Created	Admin	2026-09-03 10:30:49.916324	Created Attendance Record (PRESENT on 2026-09-03)
383	AttendanceRecord	34	Created	Admin	2026-09-03 10:30:49.923331	Created Attendance Record (PRESENT on 2026-09-03)
384	AttendanceRecord	35	Created	Admin	2026-09-03 10:30:49.930413	Created Attendance Record (PRESENT on 2026-09-03)
385	AttendanceRecord	36	Created	Admin	2026-09-03 10:30:49.937521	Created Attendance Record (PRESENT on 2026-09-03)
386	AttendanceRecord	37	Created	Admin	2026-09-03 10:30:49.946491	Created Attendance Record (PRESENT on 2026-09-03)
387	AttendanceRecord	38	Created	Admin	2026-09-03 10:30:49.953096	Created Attendance Record (PRESENT on 2026-09-03)
388	AttendanceRecord	39	Created	Admin	2026-09-03 10:30:49.960635	Created Attendance Record (PRESENT on 2026-09-03)
392	AttendanceRecord	43	Created	Admin	2026-09-03 10:30:49.990245	Created Attendance Record (PRESENT on 2026-09-03)
398	AttendanceRecord	49	Created	Admin	2026-09-03 10:30:50.027613	Created Attendance Record (PRESENT on 2026-09-03)
402	AttendanceRecord	53	Created	Admin	2026-09-03 10:30:50.054696	Created Attendance Record (LATE on 2026-09-03)
403	Notification	36	Created	Admin	2026-09-03 10:30:50.074768	Created Notification #36
414	AttendanceRecord	59	Created	Admin	2026-09-03 10:30:50.157952	Created Attendance Record (ON_LEAVE on 2026-09-03)
1483	OperatorPerformanceLog	34	Created	Admin	2026-09-10 16:45:31.756246	Created Performance Timing Test (30s · SUBMITTED)
1484	SkillAssessment	2951	Created	Admin	2026-09-10 16:45:31.769708	Created Skill Rating 4 (Avg Cycle Time: 30s)
1503	OperatorPerformanceLog	44	Created	Admin	2026-09-10 16:45:31.8516	Created Performance Timing Test (40s · SUBMITTED)
1504	SkillAssessment	2961	Created	Admin	2026-09-10 16:45:31.854538	Created Skill Rating 5 (Avg Cycle Time: 40s)
1523	OperatorPerformanceLog	54	Created	Admin	2026-09-10 16:45:31.92967	Created Performance Timing Test (26s · SUBMITTED)
1524	SkillAssessment	2971	Created	Admin	2026-09-10 16:45:31.934894	Created Skill Rating 5 (Avg Cycle Time: 26s)
1543	OperatorPerformanceLog	64	Created	Admin	2026-09-10 16:45:32.017724	Created Performance Timing Test (46s · SUBMITTED)
1544	SkillAssessment	2981	Created	Admin	2026-09-10 16:45:32.022745	Created Skill Rating 3 (Avg Cycle Time: 46s)
1563	OperatorPerformanceLog	74	Created	Admin	2026-09-10 16:45:32.139322	Created Performance Timing Test (36s · SUBMITTED)
1564	SkillAssessment	2991	Created	Admin	2026-09-10 16:45:32.148296	Created Skill Rating 3 (Avg Cycle Time: 36s)
1585	OperatorPerformanceLog	85	Created	Admin	2026-09-10 16:45:32.395719	Created Performance Timing Test (45s · SUBMITTED)
1586	SkillAssessment	3002	Created	Admin	2026-09-10 16:45:32.408684	Created Skill Rating 3 (Avg Cycle Time: 46s)
1605	OperatorPerformanceLog	95	Created	Admin	2026-09-10 16:45:32.601115	Created Performance Timing Test (17s · SUBMITTED)
1606	SkillAssessment	3012	Created	Admin	2026-09-10 16:45:32.610924	Created Skill Rating 5 (Avg Cycle Time: 18s)
1625	OperatorPerformanceLog	105	Created	Admin	2026-09-10 16:45:32.757208	Created Performance Timing Test (52s · SUBMITTED)
1626	SkillAssessment	3022	Created	Admin	2026-09-10 16:45:32.765558	Created Skill Rating 2 (Avg Cycle Time: 53s)
1645	OperatorPerformanceLog	115	Created	Admin	2026-09-10 16:45:32.904464	Created Performance Timing Test (43s · SUBMITTED)
1646	SkillAssessment	3032	Created	Admin	2026-09-10 16:45:32.910849	Created Skill Rating 1 (Avg Cycle Time: 44s)
1665	OperatorPerformanceLog	125	Created	Admin	2026-09-10 16:45:33.037378	Created Performance Timing Test (45s · SUBMITTED)
1666	SkillAssessment	3042	Created	Admin	2026-09-10 16:45:33.045147	Created Skill Rating 3 (Avg Cycle Time: 46s)
1685	OperatorPerformanceLog	135	Created	Admin	2026-09-10 16:45:33.190648	Created Performance Timing Test (17s · SUBMITTED)
1686	SkillAssessment	3052	Created	Admin	2026-09-10 16:45:33.198868	Created Skill Rating 5 (Avg Cycle Time: 18s)
1705	OperatorPerformanceLog	145	Created	Admin	2026-09-10 16:45:33.353158	Created Performance Timing Test (52s · SUBMITTED)
1706	SkillAssessment	3062	Created	Admin	2026-09-10 16:45:33.36014	Created Skill Rating 2 (Avg Cycle Time: 53s)
1725	OperatorPerformanceLog	155	Created	Admin	2026-09-10 16:45:33.539678	Created Performance Timing Test (19s · SUBMITTED)
1726	SkillAssessment	3072	Created	Admin	2026-09-10 16:45:33.550215	Created Skill Rating 5 (Avg Cycle Time: 20s)
1745	OperatorPerformanceLog	165	Created	Admin	2026-09-10 16:45:33.671442	Created Performance Timing Test (32s · SUBMITTED)
1746	SkillAssessment	3082	Created	Admin	2026-09-10 16:45:33.676314	Created Skill Rating 5 (Avg Cycle Time: 33s)
1765	OperatorPerformanceLog	175	Created	Admin	2026-09-10 16:45:33.789146	Created Performance Timing Test (20s · SUBMITTED)
1766	SkillAssessment	3092	Created	Admin	2026-09-10 16:45:33.795737	Created Skill Rating 5 (Avg Cycle Time: 21s)
1785	OperatorPerformanceLog	185	Created	Admin	2026-09-10 16:45:33.950191	Created Performance Timing Test (79s · SUBMITTED)
1786	SkillAssessment	3102	Created	Admin	2026-09-10 16:45:33.958568	Created Skill Rating 1 (Avg Cycle Time: 80s)
1805	OperatorPerformanceLog	195	Created	Admin	2026-09-10 16:45:34.094169	Created Performance Timing Test (42s · SUBMITTED)
1806	SkillAssessment	3112	Created	Admin	2026-09-10 16:45:34.100495	Created Skill Rating 1 (Avg Cycle Time: 43s)
1825	OperatorPerformanceLog	205	Created	Admin	2026-09-10 16:45:34.232121	Created Performance Timing Test (46s · SUBMITTED)
1826	SkillAssessment	3122	Created	Admin	2026-09-10 16:45:34.2412	Created Skill Rating 3 (Avg Cycle Time: 47s)
1845	OperatorPerformanceLog	215	Created	Admin	2026-09-10 16:45:34.363918	Created Performance Timing Test (25s · SUBMITTED)
1846	SkillAssessment	3132	Created	Admin	2026-09-10 16:45:34.370491	Created Skill Rating 5 (Avg Cycle Time: 26s)
1865	OperatorPerformanceLog	225	Created	Admin	2026-09-10 16:45:34.509526	Created Performance Timing Test (63s · SUBMITTED)
1866	SkillAssessment	3142	Created	Admin	2026-09-10 16:45:34.518153	Created Skill Rating 1 (Avg Cycle Time: 64s)
1885	OperatorPerformanceLog	235	Created	Admin	2026-09-10 16:45:34.667875	Created Performance Timing Test (28s · SUBMITTED)
1886	SkillAssessment	3152	Created	Admin	2026-09-10 16:45:34.673873	Created Skill Rating 5 (Avg Cycle Time: 29s)
1905	OperatorPerformanceLog	245	Created	Admin	2026-09-10 16:45:34.809892	Created Performance Timing Test (68s · SUBMITTED)
1906	SkillAssessment	3162	Created	Admin	2026-09-10 16:45:34.819247	Created Skill Rating 1 (Avg Cycle Time: 69s)
1925	OperatorPerformanceLog	255	Created	Admin	2026-09-10 16:45:34.961966	Created Performance Timing Test (17s · SUBMITTED)
1926	SkillAssessment	3172	Created	Admin	2026-09-10 16:45:34.970252	Created Skill Rating 5 (Avg Cycle Time: 18s)
1945	OperatorPerformanceLog	265	Created	Admin	2026-09-10 16:45:35.140975	Created Performance Timing Test (64s · SUBMITTED)
1946	SkillAssessment	3182	Created	Admin	2026-09-10 16:45:35.15075	Created Skill Rating 1 (Avg Cycle Time: 65s)
1949	OperatorPerformanceLog	267	Created	Admin	2026-09-10 16:45:35.174669	Created Performance Timing Test (24s · SUBMITTED)
1950	SkillAssessment	3184	Created	Admin	2026-09-10 16:45:35.185567	Created Skill Rating 5 (Avg Cycle Time: 25s)
1951	OperatorPerformanceLog	268	Created	Admin	2026-09-10 16:45:35.193212	Created Performance Timing Test (48s · SUBMITTED)
1952	SkillAssessment	3185	Created	Admin	2026-09-10 16:45:35.203053	Created Skill Rating 3 (Avg Cycle Time: 48s)
2271	SewingLine	2	Deleted	Admin	2026-09-10 16:54:52.967699	Deleted SewingLine #2
389	AttendanceRecord	40	Created	Admin	2026-09-03 10:30:49.968701	Created Attendance Record (PRESENT on 2026-09-03)
399	AttendanceRecord	50	Created	Admin	2026-09-03 10:30:50.033507	Created Attendance Record (PRESENT on 2026-09-03)
415	AttendanceRecord	60	Created	Admin	2026-09-03 10:30:50.164965	Created Attendance Record (ON_LEAVE on 2026-09-03)
1550	SkillAssessment	2984	Created	Admin	2026-09-10 16:45:32.043958	Created Skill Rating 5 (Avg Cycle Time: 21s)
1551	OperatorPerformanceLog	68	Created	Admin	2026-09-10 16:45:32.048021	Created Performance Timing Test (40s · SUBMITTED)
1552	SkillAssessment	2985	Created	Admin	2026-09-10 16:45:32.052969	Created Skill Rating 5 (Avg Cycle Time: 40s)
1553	OperatorPerformanceLog	69	Created	Admin	2026-09-10 16:45:32.05609	Created Performance Timing Test (38s · SUBMITTED)
1554	SkillAssessment	2986	Created	Admin	2026-09-10 16:45:32.059188	Created Skill Rating 5 (Avg Cycle Time: 39s)
1555	OperatorPerformanceLog	70	Created	Admin	2026-09-10 16:45:32.064366	Created Performance Timing Test (19s · SUBMITTED)
1556	SkillAssessment	2987	Created	Admin	2026-09-10 16:45:32.069206	Created Skill Rating 5 (Avg Cycle Time: 19s)
1557	OperatorPerformanceLog	71	Created	Admin	2026-09-10 16:45:32.072287	Created Performance Timing Test (17s · SUBMITTED)
1558	SkillAssessment	2988	Created	Admin	2026-09-10 16:45:32.080415	Created Skill Rating 5 (Avg Cycle Time: 18s)
1561	OperatorPerformanceLog	73	Created	Admin	2026-09-10 16:45:32.12109	Created Performance Timing Test (37s · SUBMITTED)
1562	SkillAssessment	2990	Created	Admin	2026-09-10 16:45:32.127577	Created Skill Rating 4 (Avg Cycle Time: 38s)
1567	OperatorPerformanceLog	76	Created	Admin	2026-09-10 16:45:32.186319	Created Performance Timing Test (56s · SUBMITTED)
1568	SkillAssessment	2993	Created	Admin	2026-09-10 16:45:32.202658	Created Skill Rating 2 (Avg Cycle Time: 56s)
1569	OperatorPerformanceLog	77	Created	Admin	2026-09-10 16:45:32.215739	Created Performance Timing Test (54s · SUBMITTED)
1570	SkillAssessment	2994	Created	Admin	2026-09-10 16:45:32.238485	Created Skill Rating 2 (Avg Cycle Time: 55s)
1571	OperatorPerformanceLog	78	Created	Admin	2026-09-10 16:45:32.258028	Created Performance Timing Test (19s · SUBMITTED)
1572	SkillAssessment	2995	Created	Admin	2026-09-10 16:45:32.265281	Created Skill Rating 5 (Avg Cycle Time: 19s)
1573	OperatorPerformanceLog	79	Created	Admin	2026-09-10 16:45:32.279399	Created Performance Timing Test (17s · SUBMITTED)
1574	SkillAssessment	2996	Created	Admin	2026-09-10 16:45:32.289204	Created Skill Rating 5 (Avg Cycle Time: 18s)
1575	OperatorPerformanceLog	80	Created	Admin	2026-09-10 16:45:32.295342	Created Performance Timing Test (54s · SUBMITTED)
1576	SkillAssessment	2997	Created	Admin	2026-09-10 16:45:32.305134	Created Skill Rating 2 (Avg Cycle Time: 54s)
1577	OperatorPerformanceLog	81	Created	Admin	2026-09-10 16:45:32.31161	Created Performance Timing Test (52s · SUBMITTED)
1578	SkillAssessment	2998	Created	Admin	2026-09-10 16:45:32.324722	Created Skill Rating 2 (Avg Cycle Time: 53s)
1579	OperatorPerformanceLog	82	Created	Admin	2026-09-10 16:45:32.336788	Created Performance Timing Test (26s · SUBMITTED)
1580	SkillAssessment	2999	Created	Admin	2026-09-10 16:45:32.34613	Created Skill Rating 5 (Avg Cycle Time: 26s)
1583	OperatorPerformanceLog	84	Created	Admin	2026-09-10 16:45:32.375476	Created Performance Timing Test (47s · SUBMITTED)
1584	SkillAssessment	3001	Created	Admin	2026-09-10 16:45:32.389622	Created Skill Rating 3 (Avg Cycle Time: 47s)
1589	OperatorPerformanceLog	87	Created	Admin	2026-09-10 16:45:32.439186	Created Performance Timing Test (21s · SUBMITTED)
1590	SkillAssessment	3004	Created	Admin	2026-09-10 16:45:32.452457	Created Skill Rating 5 (Avg Cycle Time: 22s)
1591	OperatorPerformanceLog	88	Created	Admin	2026-09-10 16:45:32.46095	Created Performance Timing Test (55s · SUBMITTED)
1592	SkillAssessment	3005	Created	Admin	2026-09-10 16:45:32.471813	Created Skill Rating 1 (Avg Cycle Time: 55s)
1593	OperatorPerformanceLog	89	Created	Admin	2026-09-10 16:45:32.484796	Created Performance Timing Test (53s · SUBMITTED)
1594	SkillAssessment	3006	Created	Admin	2026-09-10 16:45:32.496025	Created Skill Rating 2 (Avg Cycle Time: 54s)
1595	OperatorPerformanceLog	90	Created	Admin	2026-09-10 16:45:32.507356	Created Performance Timing Test (21s · SUBMITTED)
1596	SkillAssessment	3007	Created	Admin	2026-09-10 16:45:32.518207	Created Skill Rating 5 (Avg Cycle Time: 21s)
1597	OperatorPerformanceLog	91	Created	Admin	2026-09-10 16:45:32.525082	Created Performance Timing Test (19s · SUBMITTED)
1598	SkillAssessment	3008	Created	Admin	2026-09-10 16:45:32.535911	Created Skill Rating 5 (Avg Cycle Time: 20s)
1599	OperatorPerformanceLog	92	Created	Admin	2026-09-10 16:45:32.541053	Created Performance Timing Test (34s · SUBMITTED)
1600	SkillAssessment	3009	Created	Admin	2026-09-10 16:45:32.550764	Created Skill Rating 5 (Avg Cycle Time: 34s)
1603	OperatorPerformanceLog	94	Created	Admin	2026-09-10 16:45:32.570842	Created Performance Timing Test (19s · SUBMITTED)
1604	SkillAssessment	3011	Created	Admin	2026-09-10 16:45:32.589541	Created Skill Rating 5 (Avg Cycle Time: 19s)
1609	OperatorPerformanceLog	97	Created	Admin	2026-09-10 16:45:32.637186	Created Performance Timing Test (43s · SUBMITTED)
1610	SkillAssessment	3014	Created	Admin	2026-09-10 16:45:32.644166	Created Skill Rating 3 (Avg Cycle Time: 44s)
1611	OperatorPerformanceLog	98	Created	Admin	2026-09-10 16:45:32.653383	Created Performance Timing Test (30s · SUBMITTED)
1612	SkillAssessment	3015	Created	Admin	2026-09-10 16:45:32.660149	Created Skill Rating 4 (Avg Cycle Time: 30s)
1613	OperatorPerformanceLog	99	Created	Admin	2026-09-10 16:45:32.667768	Created Performance Timing Test (28s · SUBMITTED)
1614	SkillAssessment	3016	Created	Admin	2026-09-10 16:45:32.676029	Created Skill Rating 5 (Avg Cycle Time: 29s)
1615	OperatorPerformanceLog	100	Created	Admin	2026-09-10 16:45:32.685706	Created Performance Timing Test (56s · SUBMITTED)
1616	SkillAssessment	3017	Created	Admin	2026-09-10 16:45:32.693965	Created Skill Rating 2 (Avg Cycle Time: 56s)
1617	OperatorPerformanceLog	101	Created	Admin	2026-09-10 16:45:32.702141	Created Performance Timing Test (54s · SUBMITTED)
1618	SkillAssessment	3018	Created	Admin	2026-09-10 16:45:32.708884	Created Skill Rating 2 (Avg Cycle Time: 55s)
1619	OperatorPerformanceLog	102	Created	Admin	2026-09-10 16:45:32.715877	Created Performance Timing Test (20s · SUBMITTED)
1620	SkillAssessment	3019	Created	Admin	2026-09-10 16:45:32.722278	Created Skill Rating 5 (Avg Cycle Time: 20s)
1623	OperatorPerformanceLog	104	Created	Admin	2026-09-10 16:45:32.741599	Created Performance Timing Test (54s · SUBMITTED)
1624	SkillAssessment	3021	Created	Admin	2026-09-10 16:45:32.752018	Created Skill Rating 2 (Avg Cycle Time: 54s)
1629	OperatorPerformanceLog	107	Created	Admin	2026-09-10 16:45:32.783011	Created Performance Timing Test (27s · SUBMITTED)
390	AttendanceRecord	41	Created	Admin	2026-09-03 10:30:49.975735	Created Attendance Record (PRESENT on 2026-09-03)
400	AttendanceRecord	51	Created	Admin	2026-09-03 10:30:50.042238	Created Attendance Record (PRESENT on 2026-09-03)
416	AttendanceRecord	61	Created	Admin	2026-09-03 10:30:50.173505	Created Attendance Record (ON_LEAVE on 2026-09-03)
1630	SkillAssessment	3024	Created	Admin	2026-09-10 16:45:32.789175	Created Skill Rating 5 (Avg Cycle Time: 28s)
1631	OperatorPerformanceLog	108	Created	Admin	2026-09-10 16:45:32.79382	Created Performance Timing Test (47s · SUBMITTED)
1632	SkillAssessment	3025	Created	Admin	2026-09-10 16:45:32.804107	Created Skill Rating 3 (Avg Cycle Time: 47s)
1633	OperatorPerformanceLog	109	Created	Admin	2026-09-10 16:45:32.808981	Created Performance Timing Test (45s · SUBMITTED)
1634	SkillAssessment	3026	Created	Admin	2026-09-10 16:45:32.819184	Created Skill Rating 3 (Avg Cycle Time: 46s)
1635	OperatorPerformanceLog	110	Created	Admin	2026-09-10 16:45:32.823876	Created Performance Timing Test (22s · SUBMITTED)
1636	SkillAssessment	3027	Created	Admin	2026-09-10 16:45:32.83082	Created Skill Rating 5 (Avg Cycle Time: 22s)
1637	OperatorPerformanceLog	111	Created	Admin	2026-09-10 16:45:32.837704	Created Performance Timing Test (20s · SUBMITTED)
1638	SkillAssessment	3028	Created	Admin	2026-09-10 16:45:32.846093	Created Skill Rating 5 (Avg Cycle Time: 21s)
1639	OperatorPerformanceLog	112	Created	Admin	2026-09-10 16:45:32.85419	Created Performance Timing Test (54s · SUBMITTED)
1640	SkillAssessment	3029	Created	Admin	2026-09-10 16:45:32.861931	Created Skill Rating 2 (Avg Cycle Time: 54s)
1643	OperatorPerformanceLog	114	Created	Admin	2026-09-10 16:45:32.888403	Created Performance Timing Test (45s · SUBMITTED)
1644	SkillAssessment	3031	Created	Admin	2026-09-10 16:45:32.897377	Created Skill Rating 1 (Avg Cycle Time: 45s)
1649	OperatorPerformanceLog	117	Created	Admin	2026-09-10 16:45:32.93141	Created Performance Timing Test (68s · SUBMITTED)
1650	SkillAssessment	3034	Created	Admin	2026-09-10 16:45:32.937084	Created Skill Rating 1 (Avg Cycle Time: 69s)
1651	OperatorPerformanceLog	118	Created	Admin	2026-09-10 16:45:32.942545	Created Performance Timing Test (38s · SUBMITTED)
1652	SkillAssessment	3035	Created	Admin	2026-09-10 16:45:32.951063	Created Skill Rating 4 (Avg Cycle Time: 38s)
1653	OperatorPerformanceLog	119	Created	Admin	2026-09-10 16:45:32.958295	Created Performance Timing Test (36s · SUBMITTED)
1654	SkillAssessment	3036	Created	Admin	2026-09-10 16:45:32.966014	Created Skill Rating 4 (Avg Cycle Time: 37s)
1655	OperatorPerformanceLog	120	Created	Admin	2026-09-10 16:45:32.971082	Created Performance Timing Test (81s · SUBMITTED)
1656	SkillAssessment	3037	Created	Admin	2026-09-10 16:45:32.976451	Created Skill Rating 1 (Avg Cycle Time: 81s)
1657	OperatorPerformanceLog	121	Created	Admin	2026-09-10 16:45:32.985485	Created Performance Timing Test (79s · SUBMITTED)
1658	SkillAssessment	3038	Created	Admin	2026-09-10 16:45:32.989767	Created Skill Rating 1 (Avg Cycle Time: 80s)
1659	OperatorPerformanceLog	122	Created	Admin	2026-09-10 16:45:32.997247	Created Performance Timing Test (30s · SUBMITTED)
1660	SkillAssessment	3039	Created	Admin	2026-09-10 16:45:33.004531	Created Skill Rating 4 (Avg Cycle Time: 30s)
1663	OperatorPerformanceLog	124	Created	Admin	2026-09-10 16:45:33.024388	Created Performance Timing Test (47s · SUBMITTED)
1664	SkillAssessment	3041	Created	Admin	2026-09-10 16:45:33.032431	Created Skill Rating 3 (Avg Cycle Time: 47s)
1669	OperatorPerformanceLog	127	Created	Admin	2026-09-10 16:45:33.070013	Created Performance Timing Test (29s · SUBMITTED)
1670	SkillAssessment	3044	Created	Admin	2026-09-10 16:45:33.079236	Created Skill Rating 5 (Avg Cycle Time: 30s)
1671	OperatorPerformanceLog	128	Created	Admin	2026-09-10 16:45:33.086426	Created Performance Timing Test (66s · SUBMITTED)
1672	SkillAssessment	3045	Created	Admin	2026-09-10 16:45:33.091051	Created Skill Rating 1 (Avg Cycle Time: 66s)
1673	OperatorPerformanceLog	129	Created	Admin	2026-09-10 16:45:33.101798	Created Performance Timing Test (64s · SUBMITTED)
1674	SkillAssessment	3046	Created	Admin	2026-09-10 16:45:33.108667	Created Skill Rating 1 (Avg Cycle Time: 65s)
1675	OperatorPerformanceLog	130	Created	Admin	2026-09-10 16:45:33.117048	Created Performance Timing Test (22s · SUBMITTED)
1676	SkillAssessment	3047	Created	Admin	2026-09-10 16:45:33.124385	Created Skill Rating 5 (Avg Cycle Time: 22s)
1677	OperatorPerformanceLog	131	Created	Admin	2026-09-10 16:45:33.132129	Created Performance Timing Test (20s · SUBMITTED)
1678	SkillAssessment	3048	Created	Admin	2026-09-10 16:45:33.138764	Created Skill Rating 5 (Avg Cycle Time: 21s)
1679	OperatorPerformanceLog	132	Created	Admin	2026-09-10 16:45:33.145283	Created Performance Timing Test (40s · SUBMITTED)
1680	SkillAssessment	3049	Created	Admin	2026-09-10 16:45:33.155016	Created Skill Rating 5 (Avg Cycle Time: 40s)
1683	OperatorPerformanceLog	134	Created	Admin	2026-09-10 16:45:33.17628	Created Performance Timing Test (19s · SUBMITTED)
1684	SkillAssessment	3051	Created	Admin	2026-09-10 16:45:33.183939	Created Skill Rating 5 (Avg Cycle Time: 19s)
1689	OperatorPerformanceLog	137	Created	Admin	2026-09-10 16:45:33.219232	Created Performance Timing Test (44s · SUBMITTED)
1690	SkillAssessment	3054	Created	Admin	2026-09-10 16:45:33.224125	Created Skill Rating 3 (Avg Cycle Time: 45s)
1691	OperatorPerformanceLog	138	Created	Admin	2026-09-10 16:45:33.232266	Created Performance Timing Test (26s · SUBMITTED)
1692	SkillAssessment	3055	Created	Admin	2026-09-10 16:45:33.238371	Created Skill Rating 5 (Avg Cycle Time: 26s)
1693	OperatorPerformanceLog	139	Created	Admin	2026-09-10 16:45:33.247202	Created Performance Timing Test (24s · SUBMITTED)
1694	SkillAssessment	3056	Created	Admin	2026-09-10 16:45:33.254389	Created Skill Rating 5 (Avg Cycle Time: 25s)
1695	OperatorPerformanceLog	140	Created	Admin	2026-09-10 16:45:33.260799	Created Performance Timing Test (40s · SUBMITTED)
1696	SkillAssessment	3057	Created	Admin	2026-09-10 16:45:33.269004	Created Skill Rating 5 (Avg Cycle Time: 40s)
1697	OperatorPerformanceLog	141	Created	Admin	2026-09-10 16:45:33.275284	Created Performance Timing Test (38s · SUBMITTED)
1698	SkillAssessment	3058	Created	Admin	2026-09-10 16:45:33.286477	Created Skill Rating 5 (Avg Cycle Time: 39s)
1699	OperatorPerformanceLog	142	Created	Admin	2026-09-10 16:45:33.291506	Created Performance Timing Test (26s · SUBMITTED)
1700	SkillAssessment	3059	Created	Admin	2026-09-10 16:45:33.301576	Created Skill Rating 5 (Avg Cycle Time: 26s)
1703	OperatorPerformanceLog	144	Created	Admin	2026-09-10 16:45:33.336914	Created Performance Timing Test (54s · SUBMITTED)
1704	SkillAssessment	3061	Created	Admin	2026-09-10 16:45:33.342128	Created Skill Rating 2 (Avg Cycle Time: 54s)
391	AttendanceRecord	42	Created	Admin	2026-09-03 10:30:49.983787	Created Attendance Record (PRESENT on 2026-09-03)
393	AttendanceRecord	44	Created	Admin	2026-09-03 10:30:49.995578	Created Attendance Record (PRESENT on 2026-09-03)
396	AttendanceRecord	47	Created	Admin	2026-09-03 10:30:50.014925	Created Attendance Record (PRESENT on 2026-09-03)
401	AttendanceRecord	52	Created	Admin	2026-09-03 10:30:50.048501	Created Attendance Record (PRESENT on 2026-09-03)
404	AttendanceRecord	54	Created	Admin	2026-09-03 10:30:50.081047	Created Attendance Record (LATE on 2026-09-03)
405	Notification	37	Created	Admin	2026-09-03 10:30:50.084068	Created Notification #37
410	AttendanceRecord	57	Created	Admin	2026-09-03 10:30:50.129772	Created Attendance Record (LATE on 2026-09-03)
411	Notification	40	Created	Admin	2026-09-03 10:30:50.132882	Created Notification #40
1709	OperatorPerformanceLog	147	Created	Admin	2026-09-10 16:45:33.38192	Created Performance Timing Test (34s · SUBMITTED)
1710	SkillAssessment	3064	Created	Admin	2026-09-10 16:45:33.389937	Created Skill Rating 3 (Avg Cycle Time: 35s)
1711	OperatorPerformanceLog	148	Created	Admin	2026-09-10 16:45:33.397036	Created Performance Timing Test (56s · SUBMITTED)
1712	SkillAssessment	3065	Created	Admin	2026-09-10 16:45:33.405582	Created Skill Rating 2 (Avg Cycle Time: 56s)
1713	OperatorPerformanceLog	149	Created	Admin	2026-09-10 16:45:33.412158	Created Performance Timing Test (54s · SUBMITTED)
1714	SkillAssessment	3066	Created	Admin	2026-09-10 16:45:33.423695	Created Skill Rating 2 (Avg Cycle Time: 55s)
1715	OperatorPerformanceLog	150	Created	Admin	2026-09-10 16:45:33.430527	Created Performance Timing Test (32s · SUBMITTED)
1716	SkillAssessment	3067	Created	Admin	2026-09-10 16:45:33.440291	Created Skill Rating 5 (Avg Cycle Time: 32s)
1717	OperatorPerformanceLog	151	Created	Admin	2026-09-10 16:45:33.449529	Created Performance Timing Test (30s · SUBMITTED)
1718	SkillAssessment	3068	Created	Admin	2026-09-10 16:45:33.459837	Created Skill Rating 5 (Avg Cycle Time: 31s)
1719	OperatorPerformanceLog	152	Created	Admin	2026-09-10 16:45:33.468091	Created Performance Timing Test (54s · SUBMITTED)
1720	SkillAssessment	3069	Created	Admin	2026-09-10 16:45:33.476338	Created Skill Rating 2 (Avg Cycle Time: 54s)
1723	OperatorPerformanceLog	154	Created	Admin	2026-09-10 16:45:33.52332	Created Performance Timing Test (21s · SUBMITTED)
1724	SkillAssessment	3071	Created	Admin	2026-09-10 16:45:33.532901	Created Skill Rating 5 (Avg Cycle Time: 21s)
1729	OperatorPerformanceLog	157	Created	Admin	2026-09-10 16:45:33.569525	Created Performance Timing Test (31s · SUBMITTED)
1730	SkillAssessment	3074	Created	Admin	2026-09-10 16:45:33.575459	Created Skill Rating 5 (Avg Cycle Time: 32s)
1731	OperatorPerformanceLog	158	Created	Admin	2026-09-10 16:45:33.582312	Created Performance Timing Test (19s · SUBMITTED)
1732	SkillAssessment	3075	Created	Admin	2026-09-10 16:45:33.589909	Created Skill Rating 5 (Avg Cycle Time: 19s)
1733	OperatorPerformanceLog	159	Created	Admin	2026-09-10 16:45:33.594299	Created Performance Timing Test (17s · SUBMITTED)
1734	SkillAssessment	3076	Created	Admin	2026-09-10 16:45:33.602388	Created Skill Rating 5 (Avg Cycle Time: 18s)
1735	OperatorPerformanceLog	160	Created	Admin	2026-09-10 16:45:33.605538	Created Performance Timing Test (39s · SUBMITTED)
1736	SkillAssessment	3077	Created	Admin	2026-09-10 16:45:33.610331	Created Skill Rating 4 (Avg Cycle Time: 39s)
1737	OperatorPerformanceLog	161	Created	Admin	2026-09-10 16:45:33.619353	Created Performance Timing Test (37s · SUBMITTED)
1738	SkillAssessment	3078	Created	Admin	2026-09-10 16:45:33.624446	Created Skill Rating 4 (Avg Cycle Time: 38s)
1739	OperatorPerformanceLog	162	Created	Admin	2026-09-10 16:45:33.632408	Created Performance Timing Test (25s · SUBMITTED)
1740	SkillAssessment	3079	Created	Admin	2026-09-10 16:45:33.637602	Created Skill Rating 5 (Avg Cycle Time: 25s)
1743	OperatorPerformanceLog	164	Created	Admin	2026-09-10 16:45:33.658831	Created Performance Timing Test (34s · SUBMITTED)
1744	SkillAssessment	3081	Created	Admin	2026-09-10 16:45:33.6672	Created Skill Rating 5 (Avg Cycle Time: 34s)
1749	OperatorPerformanceLog	167	Created	Admin	2026-09-10 16:45:33.690991	Created Performance Timing Test (20s · SUBMITTED)
1750	SkillAssessment	3084	Created	Admin	2026-09-10 16:45:33.701059	Created Skill Rating 5 (Avg Cycle Time: 21s)
1751	OperatorPerformanceLog	168	Created	Admin	2026-09-10 16:45:33.705871	Created Performance Timing Test (39s · SUBMITTED)
1752	SkillAssessment	3085	Created	Admin	2026-09-10 16:45:33.709707	Created Skill Rating 4 (Avg Cycle Time: 39s)
1753	OperatorPerformanceLog	169	Created	Admin	2026-09-10 16:45:33.718133	Created Performance Timing Test (37s · SUBMITTED)
1754	SkillAssessment	3086	Created	Admin	2026-09-10 16:45:33.723264	Created Skill Rating 4 (Avg Cycle Time: 38s)
1755	OperatorPerformanceLog	170	Created	Admin	2026-09-10 16:45:33.72641	Created Performance Timing Test (30s · SUBMITTED)
1756	SkillAssessment	3087	Created	Admin	2026-09-10 16:45:33.735071	Created Skill Rating 4 (Avg Cycle Time: 30s)
1757	OperatorPerformanceLog	171	Created	Admin	2026-09-10 16:45:33.738476	Created Performance Timing Test (28s · SUBMITTED)
1758	SkillAssessment	3088	Created	Admin	2026-09-10 16:45:33.744717	Created Skill Rating 5 (Avg Cycle Time: 29s)
1759	OperatorPerformanceLog	172	Created	Admin	2026-09-10 16:45:33.754747	Created Performance Timing Test (47s · SUBMITTED)
1760	SkillAssessment	3089	Created	Admin	2026-09-10 16:45:33.757924	Created Skill Rating 3 (Avg Cycle Time: 47s)
1763	OperatorPerformanceLog	174	Created	Admin	2026-09-10 16:45:33.777685	Created Performance Timing Test (22s · SUBMITTED)
1764	SkillAssessment	3091	Created	Admin	2026-09-10 16:45:33.784188	Created Skill Rating 5 (Avg Cycle Time: 22s)
1769	OperatorPerformanceLog	177	Created	Admin	2026-09-10 16:45:33.819948	Created Performance Timing Test (63s · SUBMITTED)
1770	SkillAssessment	3094	Created	Admin	2026-09-10 16:45:33.825003	Created Skill Rating 1 (Avg Cycle Time: 64s)
1771	OperatorPerformanceLog	178	Created	Admin	2026-09-10 16:45:33.834779	Created Performance Timing Test (36s · SUBMITTED)
1772	SkillAssessment	3095	Created	Admin	2026-09-10 16:45:33.839739	Created Skill Rating 3 (Avg Cycle Time: 36s)
1773	OperatorPerformanceLog	179	Created	Admin	2026-09-10 16:45:33.849785	Created Performance Timing Test (34s · SUBMITTED)
1774	SkillAssessment	3096	Created	Admin	2026-09-10 16:45:33.856484	Created Skill Rating 3 (Avg Cycle Time: 35s)
1775	OperatorPerformanceLog	180	Created	Admin	2026-09-10 16:45:33.863263	Created Performance Timing Test (71s · SUBMITTED)
1776	SkillAssessment	3097	Created	Admin	2026-09-10 16:45:33.871773	Created Skill Rating 1 (Avg Cycle Time: 71s)
2272	SewingLine	3	Deleted	Admin	2026-09-10 16:54:55.860523	Deleted SewingLine #3
394	AttendanceRecord	45	Created	Admin	2026-09-03 10:30:50.002723	Created Attendance Record (PRESENT on 2026-09-03)
395	AttendanceRecord	46	Created	Admin	2026-09-03 10:30:50.009075	Created Attendance Record (PRESENT on 2026-09-03)
406	AttendanceRecord	55	Created	Admin	2026-09-03 10:30:50.092618	Created Attendance Record (LATE on 2026-09-03)
407	Notification	38	Created	Admin	2026-09-03 10:30:50.100013	Created Notification #38
408	AttendanceRecord	56	Created	Admin	2026-09-03 10:30:50.107525	Created Attendance Record (LATE on 2026-09-03)
409	Notification	39	Created	Admin	2026-09-03 10:30:50.112526	Created Notification #39
1767	OperatorPerformanceLog	176	Created	Admin	2026-09-10 16:45:33.805332	Created Performance Timing Test (65s · SUBMITTED)
1768	SkillAssessment	3093	Created	Admin	2026-09-10 16:45:33.810664	Created Skill Rating 1 (Avg Cycle Time: 65s)
1781	OperatorPerformanceLog	183	Created	Admin	2026-09-10 16:45:33.916456	Created Performance Timing Test (37s · SUBMITTED)
1782	SkillAssessment	3100	Created	Admin	2026-09-10 16:45:33.926192	Created Skill Rating 4 (Avg Cycle Time: 38s)
1787	OperatorPerformanceLog	186	Created	Admin	2026-09-10 16:45:33.966111	Created Performance Timing Test (30s · SUBMITTED)
1788	SkillAssessment	3103	Created	Admin	2026-09-10 16:45:33.972247	Created Skill Rating 4 (Avg Cycle Time: 30s)
1801	OperatorPerformanceLog	193	Created	Admin	2026-09-10 16:45:34.067066	Created Performance Timing Test (52s · SUBMITTED)
1802	SkillAssessment	3110	Created	Admin	2026-09-10 16:45:34.07194	Created Skill Rating 2 (Avg Cycle Time: 53s)
1807	OperatorPerformanceLog	196	Created	Admin	2026-09-10 16:45:34.105056	Created Performance Timing Test (57s · SUBMITTED)
1808	SkillAssessment	3113	Created	Admin	2026-09-10 16:45:34.113242	Created Skill Rating 2 (Avg Cycle Time: 57s)
1821	OperatorPerformanceLog	203	Created	Admin	2026-09-10 16:45:34.202413	Created Performance Timing Test (28s · SUBMITTED)
1822	SkillAssessment	3120	Created	Admin	2026-09-10 16:45:34.209121	Created Skill Rating 5 (Avg Cycle Time: 29s)
1827	OperatorPerformanceLog	206	Created	Admin	2026-09-10 16:45:34.249763	Created Performance Timing Test (32s · SUBMITTED)
1828	SkillAssessment	3123	Created	Admin	2026-09-10 16:45:34.25493	Created Skill Rating 5 (Avg Cycle Time: 32s)
1841	OperatorPerformanceLog	213	Created	Admin	2026-09-10 16:45:34.334804	Created Performance Timing Test (46s · SUBMITTED)
1842	SkillAssessment	3130	Created	Admin	2026-09-10 16:45:34.340535	Created Skill Rating 3 (Avg Cycle Time: 47s)
1847	OperatorPerformanceLog	216	Created	Admin	2026-09-10 16:45:34.375008	Created Performance Timing Test (54s · SUBMITTED)
1848	SkillAssessment	3133	Created	Admin	2026-09-10 16:45:34.383819	Created Skill Rating 2 (Avg Cycle Time: 54s)
1861	OperatorPerformanceLog	223	Created	Admin	2026-09-10 16:45:34.482574	Created Performance Timing Test (21s · SUBMITTED)
1862	SkillAssessment	3140	Created	Admin	2026-09-10 16:45:34.489087	Created Skill Rating 5 (Avg Cycle Time: 22s)
1867	OperatorPerformanceLog	226	Created	Admin	2026-09-10 16:45:34.523162	Created Performance Timing Test (36s · SUBMITTED)
1868	SkillAssessment	3143	Created	Admin	2026-09-10 16:45:34.527185	Created Skill Rating 3 (Avg Cycle Time: 36s)
1881	OperatorPerformanceLog	233	Created	Admin	2026-09-10 16:45:34.629244	Created Performance Timing Test (62s · SUBMITTED)
1882	SkillAssessment	3150	Created	Admin	2026-09-10 16:45:34.639666	Created Skill Rating 1 (Avg Cycle Time: 63s)
1887	OperatorPerformanceLog	236	Created	Admin	2026-09-10 16:45:34.683139	Created Performance Timing Test (47s · SUBMITTED)
1888	SkillAssessment	3153	Created	Admin	2026-09-10 16:45:34.6882	Created Skill Rating 3 (Avg Cycle Time: 47s)
1901	OperatorPerformanceLog	243	Created	Admin	2026-09-10 16:45:34.776737	Created Performance Timing Test (41s · SUBMITTED)
1902	SkillAssessment	3160	Created	Admin	2026-09-10 16:45:34.786518	Created Skill Rating 2 (Avg Cycle Time: 42s)
1907	OperatorPerformanceLog	246	Created	Admin	2026-09-10 16:45:34.826021	Created Performance Timing Test (39s · SUBMITTED)
1908	SkillAssessment	3163	Created	Admin	2026-09-10 16:45:34.833023	Created Skill Rating 3 (Avg Cycle Time: 39s)
1921	OperatorPerformanceLog	253	Created	Admin	2026-09-10 16:45:34.933875	Created Performance Timing Test (32s · SUBMITTED)
1922	SkillAssessment	3170	Created	Admin	2026-09-10 16:45:34.939421	Created Skill Rating 5 (Avg Cycle Time: 33s)
1927	OperatorPerformanceLog	256	Created	Admin	2026-09-10 16:45:34.976909	Created Performance Timing Test (38s · SUBMITTED)
1928	SkillAssessment	3173	Created	Admin	2026-09-10 16:45:34.986558	Created Skill Rating 4 (Avg Cycle Time: 38s)
1941	OperatorPerformanceLog	263	Created	Admin	2026-09-10 16:45:35.10831	Created Performance Timing Test (29s · SUBMITTED)
1942	SkillAssessment	3180	Created	Admin	2026-09-10 16:45:35.118131	Created Skill Rating 5 (Avg Cycle Time: 30s)
1947	OperatorPerformanceLog	266	Created	Admin	2026-09-10 16:45:35.156615	Created Performance Timing Test (26s · SUBMITTED)
1948	SkillAssessment	3183	Created	Admin	2026-09-10 16:45:35.166638	Created Skill Rating 5 (Avg Cycle Time: 26s)
1953	OperatorPerformanceLog	269	Created	Admin	2026-09-10 16:45:35.210337	Created Performance Timing Test (46s · SUBMITTED)
1954	SkillAssessment	3186	Created	Admin	2026-09-10 16:45:35.219938	Created Skill Rating 3 (Avg Cycle Time: 47s)
1955	OperatorPerformanceLog	270	Created	Admin	2026-09-10 16:45:35.226111	Created Performance Timing Test (19s · SUBMITTED)
1956	SkillAssessment	3187	Created	Admin	2026-09-10 16:45:35.23592	Created Skill Rating 5 (Avg Cycle Time: 19s)
1957	OperatorPerformanceLog	271	Created	Admin	2026-09-10 16:45:35.242919	Created Performance Timing Test (17s · SUBMITTED)
1958	SkillAssessment	3188	Created	Admin	2026-09-10 16:45:35.252014	Created Skill Rating 5 (Avg Cycle Time: 18s)
1959	OperatorPerformanceLog	272	Created	Admin	2026-09-10 16:45:35.257854	Created Performance Timing Test (54s · SUBMITTED)
1960	SkillAssessment	3189	Created	Admin	2026-09-10 16:45:35.264677	Created Skill Rating 2 (Avg Cycle Time: 54s)
1961	OperatorPerformanceLog	273	Created	Admin	2026-09-10 16:45:35.270397	Created Performance Timing Test (52s · SUBMITTED)
1962	SkillAssessment	3190	Created	Admin	2026-09-10 16:45:35.2765	Created Skill Rating 2 (Avg Cycle Time: 53s)
1963	OperatorPerformanceLog	274	Created	Admin	2026-09-10 16:45:35.283116	Created Performance Timing Test (36s · SUBMITTED)
1964	SkillAssessment	3191	Created	Admin	2026-09-10 16:45:35.289265	Created Skill Rating 3 (Avg Cycle Time: 36s)
1965	OperatorPerformanceLog	275	Created	Admin	2026-09-10 16:45:35.296536	Created Performance Timing Test (34s · SUBMITTED)
1966	SkillAssessment	3192	Created	Admin	2026-09-10 16:45:35.305044	Created Skill Rating 3 (Avg Cycle Time: 35s)
2273	SewingLine	4	Deleted	Admin	2026-09-10 16:54:59.528935	Deleted SewingLine #4
397	AttendanceRecord	48	Created	Admin	2026-09-03 10:30:50.021492	Created Attendance Record (PRESENT on 2026-09-03)
412	AttendanceRecord	58	Created	Admin	2026-09-03 10:30:50.141439	Created Attendance Record (LATE on 2026-09-03)
413	Notification	41	Created	Admin	2026-09-03 10:30:50.148587	Created Notification #41
417	Notification	7	Updated	Admin	2026-09-03 10:43:33.575556	Updated Notification #7
418	Notification	42	Created	Admin	2026-09-03 10:46:45.424213	Created Notification #42
419	AttendanceRecord	22	Updated	Admin	2026-09-03 10:46:45.432102	Updated Attendance Record (LATE on 2026-09-03)
420	PieceProductionLog	34	Created	Admin	2026-09-03 10:48:55.380924	Created PieceProductionLog #34
421	PieceProductionLog	35	Created	Admin	2026-09-03 10:49:37.205225	Created PieceProductionLog #35
422	PieceProductionLog	36	Created	Admin	2026-09-03 10:49:59.699187	Created PieceProductionLog #36
423	PieceProductionLog	37	Created	Admin	2026-09-03 10:50:18.664102	Created PieceProductionLog #37
424	PieceProductionLog	38	Created	Admin	2026-09-03 10:50:48.998714	Created PieceProductionLog #38
425	AttendanceRecord	22	Updated	Admin	2026-09-03 11:04:05.392358	Updated Attendance Record (LATE on 2026-09-03)
426	AttendanceRecord	62	Created	Admin	2026-09-03 11:05:46.507128	Created Attendance Record (ON_LEAVE on 2026-09-03)
427	OperationBulletin	5	Created	Admin	2026-09-03 12:41:55.923696	Created OperationBulletin #5
428	OperationBulletin	5	Updated	Admin	2026-09-03 12:41:55.959414	Updated OperationBulletin #5
429	OperationBulletin	5	Deleted	Admin	2026-09-03 12:41:55.982765	Deleted OperationBulletin #5
430	OperationBulletin	6	Created	Admin	2026-09-03 12:42:18.18565	Created OperationBulletin #6
431	Notification	7	Updated	Admin	2026-09-03 12:46:51.86621	Updated Notification #7
432	Notification	7	Updated	Admin	2026-09-03 15:40:44.047776	Updated Notification #7
433	SkillAssessment	1123	Created	Admin	2026-09-03 16:35:00.496091	Created Skill Rating 3 (Avg Cycle Time: 32s)
434	SkillAssessment	1124	Created	Admin	2026-09-03 16:35:00.51805	Created Skill Rating 3 (Avg Cycle Time: 47s)
435	Notification	7	Updated	Admin	2026-09-03 17:22:05.929624	Updated Notification #7
436	Notification	7	Updated	Admin	2026-09-03 17:22:14.812716	Updated Notification #7
437	Notification	7	Updated	Admin	2026-09-03 17:22:17.169526	Updated Notification #7
438	Order	5	Updated	Admin	2026-09-03 17:28:18.670317	Updated Order PO-TSHIRT-480 (Buyer: Zara Men · Qty: 4800 pcs · Status: IN_PRODUCTION)
439	Order	6	Created	Admin	2026-09-03 17:38:19.238691	Created Order TEST-DEL-001 (Buyer: Test Buyer · Qty: 100 pcs · Status: PLANNED)
440	Order	6	Deleted	Admin	2026-09-03 17:38:19.287911	Deleted Order TEST-DEL-001 (Buyer: Test Buyer · Qty: 100 pcs · Status: PLANNED)
441	Order	7	Created	Admin	2026-09-03 17:38:25.931134	Created Order TEST-CASCADE-002 (Buyer: Cascade Test · Qty: 200 pcs · Status: PLANNED)
442	Order	7	Deleted	Admin	2026-09-03 17:38:25.959415	Deleted Order TEST-CASCADE-002 (Buyer: Cascade Test · Qty: 200 pcs · Status: PLANNED)
443	Order	8	Created	Admin	2026-09-03 17:39:27.007476	Created Order PO-VERIFY-001 (Buyer: Verification Buyer · Qty: 500 pcs · Status: PLANNED)
444	Order	8	Deleted	Admin	2026-09-03 17:39:27.025512	Deleted Order PO-VERIFY-001 (Buyer: Verification Buyer · Qty: 500 pcs · Status: PLANNED)
445	LinePlanAssignment	1	Deleted	Admin	2026-09-03 17:40:32.220294	Deleted LinePlanAssignment #1
446	LinePlan	1	Deleted	Admin	2026-09-03 17:40:32.235051	Deleted LinePlan #1
447	Order	1	Deleted	Admin	2026-09-03 17:40:32.250754	Deleted Order PO-2026-002 (Buyer: vijay traders · Qty: 99 pcs · Status: IN_PRODUCTION)
448	LinePlanAssignment	2	Deleted	Admin	2026-09-03 17:41:05.218552	Deleted LinePlanAssignment #2
449	LinePlan	2	Deleted	Admin	2026-09-03 17:41:05.24647	Deleted LinePlan #2
450	Order	3	Deleted	Admin	2026-09-03 17:41:05.255416	Deleted Order PO-2026-004 (Buyer: vijay traders · Qty: 13 pcs · Status: PLANNED)
451	LinePlanAssignment	3	Deleted	Admin	2026-09-03 17:41:09.170331	Deleted LinePlanAssignment #3
452	LinePlan	3	Deleted	Admin	2026-09-03 17:41:09.186055	Deleted LinePlan #3
453	Order	2	Deleted	Admin	2026-09-03 17:41:09.196665	Deleted Order PO-2026-003 (Buyer: ajay trader · Qty: 69 pcs · Status: IN_PRODUCTION)
454	Order	5	Updated	Admin	2026-09-03 17:41:32.805318	Updated Order PO-2026-002 (Buyer: Zara Men · Qty: 4800 pcs · Status: IN_PRODUCTION)
455	Order	9	Created	Admin	2026-09-03 17:44:45.122182	Created Order PO-2026-003 (Buyer: Netplay · Qty: 12000 pcs · Status: PLANNED)
456	Order	9	Updated	Admin	2026-09-03 17:45:23.534971	Updated Order PO-2026-003 (Buyer: Netplay · Qty: 12000 pcs · Status: PLANNED)
457	Notification	43	Created	Admin	2026-09-03 17:45:31.826341	Created Notification #43
458	OperationBulletin	6	Deleted	Admin	2026-09-03 17:47:51.948151	Deleted OperationBulletin #6
459	OperationBulletin	4	Deleted	Admin	2026-09-03 17:47:55.054981	Deleted OperationBulletin #4
460	Notification	43	Updated	Admin	2026-09-03 17:48:00.564639	Updated Notification #43
461	Notification	7	Updated	Admin	2026-09-03 17:48:09.402302	Updated Notification #7
462	Notification	43	Updated	Admin	2026-09-03 17:48:38.991149	Updated Notification #43
463	OperationBulletin	1	Deleted	Admin	2026-09-03 17:49:36.502532	Deleted OperationBulletin #1
464	OperationBulletin	7	Created	Admin	2026-09-03 18:16:04.030948	Created OperationBulletin #7
465	Notification	43	Updated	Admin	2026-09-03 18:16:23.337852	Updated Notification #43
466	OperationBulletin	7	Updated	Admin	2026-09-03 18:22:17.165753	Updated OperationBulletin #7
467	OperationBulletin	7	Updated	Admin	2026-09-03 18:22:58.938043	Updated OperationBulletin #7
468	OperationBulletin	7	Updated	Admin	2026-09-03 18:22:58.948758	Updated OperationBulletin #7
469	OperationBulletin	7	Updated	Admin	2026-09-03 18:22:58.965059	Updated OperationBulletin #7
470	OperationBulletin	7	Updated	Admin	2026-09-03 18:28:15.004042	Updated OperationBulletin #7
471	Notification	43	Updated	Admin	2026-09-07 15:13:36.94281	Updated Notification #43
472	Notification	7	Updated	Admin	2026-09-07 15:13:40.167466	Updated Notification #7
473	Notification	7	Updated	Admin	2026-09-07 15:13:40.27459	Updated Notification #7
474	Notification	43	Updated	Admin	2026-09-07 15:13:43.565784	Updated Notification #43
475	Notification	7	Updated	Admin	2026-09-08 14:46:36.870884	Updated Notification #7
476	Notification	7	Updated	Admin	2026-09-08 14:46:36.92129	Updated Notification #7
477	Notification	43	Updated	Admin	2026-09-08 14:46:47.095608	Updated Notification #43
478	Notification	43	Updated	Admin	2026-09-08 14:46:47.146883	Updated Notification #43
479	Notification	44	Created	Admin	2026-09-08 14:48:33.319464	Created Notification #44
480	Order	5	Updated	Admin	2026-09-08 14:48:58.972141	Updated Order PO-2026-002 (Buyer: Zara Men · Qty: 4800 pcs · Status: IN_PRODUCTION)
481	Notification	7	Updated	Admin	2026-09-08 14:49:05.503322	Updated Notification #7
1777	OperatorPerformanceLog	181	Created	Admin	2026-09-10 16:45:33.879176	Created Performance Timing Test (69s · SUBMITTED)
1778	SkillAssessment	3098	Created	Admin	2026-09-10 16:45:33.889306	Created Skill Rating 1 (Avg Cycle Time: 70s)
1779	OperatorPerformanceLog	182	Created	Admin	2026-09-10 16:45:33.898099	Created Performance Timing Test (39s · SUBMITTED)
1780	SkillAssessment	3099	Created	Admin	2026-09-10 16:45:33.906916	Created Skill Rating 3 (Avg Cycle Time: 39s)
1783	OperatorPerformanceLog	184	Created	Admin	2026-09-10 16:45:33.934341	Created Performance Timing Test (81s · SUBMITTED)
1784	SkillAssessment	3101	Created	Admin	2026-09-10 16:45:33.942496	Created Skill Rating 1 (Avg Cycle Time: 81s)
1789	OperatorPerformanceLog	187	Created	Admin	2026-09-10 16:45:33.982401	Created Performance Timing Test (28s · SUBMITTED)
1790	SkillAssessment	3104	Created	Admin	2026-09-10 16:45:33.988366	Created Skill Rating 5 (Avg Cycle Time: 29s)
1791	OperatorPerformanceLog	188	Created	Admin	2026-09-10 16:45:33.994217	Created Performance Timing Test (41s · SUBMITTED)
1792	SkillAssessment	3105	Created	Admin	2026-09-10 16:45:34.001258	Created Skill Rating 5 (Avg Cycle Time: 41s)
1793	OperatorPerformanceLog	189	Created	Admin	2026-09-10 16:45:34.008057	Created Performance Timing Test (39s · SUBMITTED)
1794	SkillAssessment	3106	Created	Admin	2026-09-10 16:45:34.018065	Created Skill Rating 5 (Avg Cycle Time: 40s)
1795	OperatorPerformanceLog	190	Created	Admin	2026-09-10 16:45:34.023417	Created Performance Timing Test (32s · SUBMITTED)
1796	SkillAssessment	3107	Created	Admin	2026-09-10 16:45:34.034301	Created Skill Rating 5 (Avg Cycle Time: 32s)
1797	OperatorPerformanceLog	191	Created	Admin	2026-09-10 16:45:34.041005	Created Performance Timing Test (30s · SUBMITTED)
1798	SkillAssessment	3108	Created	Admin	2026-09-10 16:45:34.050254	Created Skill Rating 5 (Avg Cycle Time: 31s)
1799	OperatorPerformanceLog	192	Created	Admin	2026-09-10 16:45:34.054329	Created Performance Timing Test (54s · SUBMITTED)
1800	SkillAssessment	3109	Created	Admin	2026-09-10 16:45:34.05841	Created Skill Rating 2 (Avg Cycle Time: 54s)
1803	OperatorPerformanceLog	194	Created	Admin	2026-09-10 16:45:34.078071	Created Performance Timing Test (44s · SUBMITTED)
1804	SkillAssessment	3111	Created	Admin	2026-09-10 16:45:34.088168	Created Skill Rating 1 (Avg Cycle Time: 44s)
1809	OperatorPerformanceLog	197	Created	Admin	2026-09-10 16:45:34.11828	Created Performance Timing Test (55s · SUBMITTED)
1810	SkillAssessment	3114	Created	Admin	2026-09-10 16:45:34.124281	Created Skill Rating 2 (Avg Cycle Time: 56s)
1811	OperatorPerformanceLog	198	Created	Admin	2026-09-10 16:45:34.128084	Created Performance Timing Test (39s · SUBMITTED)
1812	SkillAssessment	3115	Created	Admin	2026-09-10 16:45:34.13309	Created Skill Rating 3 (Avg Cycle Time: 39s)
1813	OperatorPerformanceLog	199	Created	Admin	2026-09-10 16:45:34.137674	Created Performance Timing Test (37s · SUBMITTED)
1814	SkillAssessment	3116	Created	Admin	2026-09-10 16:45:34.150268	Created Skill Rating 4 (Avg Cycle Time: 38s)
1815	OperatorPerformanceLog	200	Created	Admin	2026-09-10 16:45:34.161986	Created Performance Timing Test (81s · SUBMITTED)
1816	SkillAssessment	3117	Created	Admin	2026-09-10 16:45:34.17006	Created Skill Rating 1 (Avg Cycle Time: 81s)
1817	OperatorPerformanceLog	201	Created	Admin	2026-09-10 16:45:34.175086	Created Performance Timing Test (79s · SUBMITTED)
1818	SkillAssessment	3118	Created	Admin	2026-09-10 16:45:34.183111	Created Skill Rating 1 (Avg Cycle Time: 80s)
1819	OperatorPerformanceLog	202	Created	Admin	2026-09-10 16:45:34.189092	Created Performance Timing Test (30s · SUBMITTED)
1820	SkillAssessment	3119	Created	Admin	2026-09-10 16:45:34.194093	Created Skill Rating 4 (Avg Cycle Time: 30s)
1823	OperatorPerformanceLog	204	Created	Admin	2026-09-10 16:45:34.218353	Created Performance Timing Test (48s · SUBMITTED)
1824	SkillAssessment	3121	Created	Admin	2026-09-10 16:45:34.224982	Created Skill Rating 3 (Avg Cycle Time: 48s)
1829	OperatorPerformanceLog	207	Created	Admin	2026-09-10 16:45:34.260555	Created Performance Timing Test (30s · SUBMITTED)
1830	SkillAssessment	3124	Created	Admin	2026-09-10 16:45:34.266892	Created Skill Rating 5 (Avg Cycle Time: 31s)
1831	OperatorPerformanceLog	208	Created	Admin	2026-09-10 16:45:34.272209	Created Performance Timing Test (54s · SUBMITTED)
1832	SkillAssessment	3125	Created	Admin	2026-09-10 16:45:34.276854	Created Skill Rating 2 (Avg Cycle Time: 54s)
1833	OperatorPerformanceLog	209	Created	Admin	2026-09-10 16:45:34.285866	Created Performance Timing Test (52s · SUBMITTED)
1834	SkillAssessment	3126	Created	Admin	2026-09-10 16:45:34.290923	Created Skill Rating 2 (Avg Cycle Time: 53s)
1835	OperatorPerformanceLog	210	Created	Admin	2026-09-10 16:45:34.298681	Created Performance Timing Test (35s · SUBMITTED)
1836	SkillAssessment	3127	Created	Admin	2026-09-10 16:45:34.30482	Created Skill Rating 3 (Avg Cycle Time: 35s)
1837	OperatorPerformanceLog	211	Created	Admin	2026-09-10 16:45:34.308928	Created Performance Timing Test (33s · SUBMITTED)
1838	SkillAssessment	3128	Created	Admin	2026-09-10 16:45:34.318063	Created Skill Rating 3 (Avg Cycle Time: 34s)
1839	OperatorPerformanceLog	212	Created	Admin	2026-09-10 16:45:34.323162	Created Performance Timing Test (48s · SUBMITTED)
1840	SkillAssessment	3129	Created	Admin	2026-09-10 16:45:34.328083	Created Skill Rating 3 (Avg Cycle Time: 48s)
1843	OperatorPerformanceLog	214	Created	Admin	2026-09-10 16:45:34.349131	Created Performance Timing Test (27s · SUBMITTED)
1844	SkillAssessment	3131	Created	Admin	2026-09-10 16:45:34.357196	Created Skill Rating 5 (Avg Cycle Time: 27s)
1849	OperatorPerformanceLog	217	Created	Admin	2026-09-10 16:45:34.390369	Created Performance Timing Test (52s · SUBMITTED)
1850	SkillAssessment	3134	Created	Admin	2026-09-10 16:45:34.396918	Created Skill Rating 2 (Avg Cycle Time: 53s)
1851	OperatorPerformanceLog	218	Created	Admin	2026-09-10 16:45:34.405016	Created Performance Timing Test (30s · SUBMITTED)
1852	SkillAssessment	3135	Created	Admin	2026-09-10 16:45:34.410834	Created Skill Rating 4 (Avg Cycle Time: 30s)
1853	OperatorPerformanceLog	219	Created	Admin	2026-09-10 16:45:34.420284	Created Performance Timing Test (28s · SUBMITTED)
1854	SkillAssessment	3136	Created	Admin	2026-09-10 16:45:34.425835	Created Skill Rating 5 (Avg Cycle Time: 29s)
1855	OperatorPerformanceLog	220	Created	Admin	2026-09-10 16:45:34.435934	Created Performance Timing Test (48s · SUBMITTED)
1856	SkillAssessment	3137	Created	Admin	2026-09-10 16:45:34.442395	Created Skill Rating 3 (Avg Cycle Time: 48s)
1857	OperatorPerformanceLog	221	Created	Admin	2026-09-10 16:45:34.452075	Created Performance Timing Test (46s · SUBMITTED)
482	Notification	7	Updated	Admin	2026-09-08 14:49:35.621908	Updated Notification #7
483	Notification	7	Updated	Admin	2026-09-08 14:49:35.683338	Updated Notification #7
484	OperationBulletin	9	Created	Admin	2026-09-09 12:17:17.848595	Created OperationBulletin #9
485	Notification	7	Updated	Admin	2026-09-09 12:18:05.426701	Updated Notification #7
486	Notification	43	Updated	Admin	2026-09-09 12:20:03.251811	Updated Notification #43
487	Notification	43	Updated	Admin	2026-09-09 12:20:03.327917	Updated Notification #43
488	Order	16	Updated	Admin	2026-09-09 12:36:30.472756	Updated Order PO-UNIQLO-DENIM-900 (Buyer: Uniqlo LifeWear · Qty: 14000 pcs · Status: PLANNED)
489	Notification	45	Created	Admin	2026-09-09 12:37:08.462109	Created Notification #45
490	Notification	45	Updated	Admin	2026-09-09 12:37:08.580181	Updated Notification #45
491	OperationBulletin	9	Deleted	Admin	2026-09-09 12:39:09.216403	Deleted OperationBulletin #9
492	OperationBulletin	10	Created	Admin	2026-09-09 12:41:03.191858	Created OperationBulletin #10
493	Notification	45	Updated	Admin	2026-09-09 12:41:14.279644	Updated Notification #45
494	Notification	45	Updated	Admin	2026-09-09 12:45:48.823217	Updated Notification #45
495	Notification	45	Updated	Admin	2026-09-09 13:01:22.797715	Updated Notification #45
496	Notification	45	Updated	Admin	2026-09-09 13:01:22.856522	Updated Notification #45
497	Notification	45	Updated	Admin	2026-09-09 14:05:48.621215	Updated Notification #45
498	Notification	45	Updated	Admin	2026-09-09 14:05:48.687262	Updated Notification #45
499	Notification	45	Updated	Admin	2026-09-09 14:06:24.028278	Updated Notification #45
500	Notification	45	Updated	Admin	2026-09-09 14:09:42.171606	Updated Notification #45
501	Notification	45	Updated	Admin	2026-09-09 14:09:42.246763	Updated Notification #45
502	Notification	44	Updated	Admin	2026-09-09 14:31:30.853013	Updated Notification #44
503	Notification	44	Updated	Admin	2026-09-09 14:34:32.424881	Updated Notification #44
504	Notification	45	Updated	Admin	2026-09-09 15:06:29.496379	Updated Notification #45
505	Notification	45	Updated	Admin	2026-09-09 15:06:29.565484	Updated Notification #45
506	OperationBulletin	10	Updated	Admin	2026-09-09 16:43:02.163519	Updated OperationBulletin #10
507	Order	15	Updated	Admin	2026-09-09 16:47:36.401342	Updated Order PO-LEVIS-CHINO-620 (Buyer: Levi Strauss & Co · Qty: 620 pcs · Status: PLANNED)
508	OperationBulletin	10	Updated	Admin	2026-09-09 17:15:36.933176	Updated OperationBulletin #10
509	OperationBulletin	10	Updated	Admin	2026-09-09 17:46:02.777586	Updated OperationBulletin #10
510	OperationBulletin	10	Updated	Admin	2026-09-09 18:01:09.608194	Updated OperationBulletin #10
511	Notification	45	Updated	Admin	2026-09-09 18:01:19.054648	Updated Notification #45
512	Notification	45	Updated	Admin	2026-09-09 18:38:05.21419	Updated Notification #45
513	Notification	45	Updated	Admin	2026-09-10 09:24:31.680685	Updated Notification #45
514	Notification	45	Updated	Admin	2026-09-10 09:24:31.744944	Updated Notification #45
515	Notification	45	Updated	Admin	2026-09-10 09:24:31.760762	Updated Notification #45
516	Notification	43	Updated	Admin	2026-09-10 09:44:31.831292	Updated Notification #43
517	Notification	43	Updated	Admin	2026-09-10 09:44:31.912398	Updated Notification #43
518	OperationBulletin	10	Updated	Admin	2026-09-10 10:15:31.654052	Updated OperationBulletin #10
519	OperationBulletin	10	Updated	Admin	2026-09-10 10:16:20.44565	Updated OperationBulletin #10
520	OperationBulletin	10	Updated	Admin	2026-09-10 10:31:13.590894	Updated OperationBulletin #10
521	LinePlan	5	Created	Admin	2026-09-10 10:34:25.494426	Created LinePlan #5
522	LinePlanAssignment	25	Created	Admin	2026-09-10 10:34:25.504287	Created LinePlanAssignment #25
523	LinePlanAssignment	26	Created	Admin	2026-09-10 10:34:25.513599	Created LinePlanAssignment #26
524	LinePlanAssignment	27	Created	Admin	2026-09-10 10:34:25.515611	Created LinePlanAssignment #27
525	LinePlanAssignment	28	Created	Admin	2026-09-10 10:34:25.515611	Created LinePlanAssignment #28
526	LinePlanAssignment	29	Created	Admin	2026-09-10 10:34:25.521751	Created LinePlanAssignment #29
527	LinePlanAssignment	30	Created	Admin	2026-09-10 10:34:25.524268	Created LinePlanAssignment #30
528	LinePlanAssignment	31	Created	Admin	2026-09-10 10:34:25.528161	Created LinePlanAssignment #31
529	LinePlanAssignment	32	Created	Admin	2026-09-10 10:34:25.529656	Created LinePlanAssignment #32
530	Notification	45	Updated	Admin	2026-09-10 10:39:07.246327	Updated Notification #45
531	Notification	45	Updated	Admin	2026-09-10 10:39:25.625036	Updated Notification #45
532	Notification	45	Updated	Admin	2026-09-10 10:39:25.667203	Updated Notification #45
533	Notification	45	Updated	Admin	2026-09-10 10:58:20.304451	Updated Notification #45
534	Notification	45	Updated	Admin	2026-09-10 10:58:20.329157	Updated Notification #45
535	PieceProductionLog	39	Created	Admin	2026-09-10 11:02:47.108282	Created PieceProductionLog #39
536	PieceProductionLog	40	Created	Admin	2026-09-10 11:03:01.96806	Created PieceProductionLog #40
537	PieceProductionLog	41	Created	Admin	2026-09-10 11:03:23.291026	Created PieceProductionLog #41
538	PieceProductionLog	42	Created	Admin	2026-09-10 11:03:55.850022	Created PieceProductionLog #42
539	PieceProductionLog	43	Created	Admin	2026-09-10 11:04:15.463307	Created PieceProductionLog #43
540	PieceProductionLog	44	Created	Admin	2026-09-10 11:04:31.744652	Created PieceProductionLog #44
541	Notification	45	Updated	Admin	2026-09-10 11:05:21.599277	Updated Notification #45
542	Notification	45	Updated	Admin	2026-09-10 11:05:21.641668	Updated Notification #45
543	Notification	45	Updated	Admin	2026-09-10 11:05:21.677191	Updated Notification #45
544	Notification	45	Updated	Admin	2026-09-10 11:33:29.294155	Updated Notification #45
545	Notification	45	Updated	Admin	2026-09-10 12:16:47.978984	Updated Notification #45
546	Notification	45	Updated	Admin	2026-09-10 12:16:48.03294	Updated Notification #45
547	Notification	45	Updated	Admin	2026-09-10 12:23:50.140514	Updated Notification #45
548	Notification	45	Updated	Admin	2026-09-10 12:23:50.19587	Updated Notification #45
549	Notification	45	Updated	Admin	2026-09-10 12:23:50.251532	Updated Notification #45
550	Notification	45	Updated	Admin	2026-09-10 12:35:19.812491	Updated Notification #45
551	Notification	45	Updated	Admin	2026-09-10 12:37:19.166092	Updated Notification #45
552	Notification	45	Updated	Admin	2026-09-10 12:37:19.254691	Updated Notification #45
553	OperationAffinity	16	Created	Admin	2026-09-10 12:53:47.53634	Created OperationAffinity #16
2267	Notification	7	Updated	Admin	2026-09-10 16:53:30.012022	Updated Notification #7
554	OperationAffinity	17	Created	Admin	2026-09-10 12:53:47.552777	Created OperationAffinity #17
555	Notification	45	Updated	Admin	2026-09-10 15:03:08.109734	Updated Notification #45
556	Notification	45	Updated	Admin	2026-09-10 15:03:08.169144	Updated Notification #45
557	Notification	45	Updated	Admin	2026-09-10 15:03:08.169144	Updated Notification #45
558	OperationBulletin	10	Updated	Admin	2026-09-10 15:09:34.918957	Updated OperationBulletin #10
559	OperationBulletin	10	Updated	Admin	2026-09-10 15:10:41.0603	Updated OperationBulletin #10
560	OperationBulletin	10	Updated	Admin	2026-09-10 15:11:12.473255	Updated OperationBulletin #10
561	OperationBulletin	10	Updated	Admin	2026-09-10 15:31:19.676452	Updated OperationBulletin #10
562	OperationBulletin	10	Updated	Admin	2026-09-10 15:33:03.217271	Updated OperationBulletin #10
563	Order	13	Deleted	Admin	2026-09-10 15:34:26.411638	Deleted Order PO-NIKE-POLO-800 (Buyer: Nike Sportswear · Qty: 800 pcs · Status: IN_PRODUCTION)
564	Order	14	Deleted	Admin	2026-09-10 15:34:31.563266	Deleted Order PO-HM-HOODIE-550 (Buyer: H&M Casuals · Qty: 550 pcs · Status: PLANNED)
565	OperationBulletin	10	Updated	Admin	2026-09-10 15:52:29.956204	Updated OperationBulletin #10
566	Notification	45	Updated	Admin	2026-09-10 15:53:41.697463	Updated Notification #45
567	SkillAssessment	2043	Created	Admin	2026-09-10 16:44:32.849374	Created Skill Rating 4 (Avg Cycle Time: 23s)
568	SkillAssessment	2044	Created	Admin	2026-09-10 16:44:32.870199	Created Skill Rating 4 (Avg Cycle Time: 38s)
569	SkillAssessment	2045	Created	Admin	2026-09-10 16:44:32.89005	Created Skill Rating 3 (Avg Cycle Time: 24s)
570	SkillAssessment	2046	Created	Admin	2026-09-10 16:44:32.901075	Created Skill Rating 3 (Avg Cycle Time: 52s)
571	SkillAssessment	2047	Created	Admin	2026-09-10 16:44:32.916655	Created Skill Rating 4 (Avg Cycle Time: 24s)
572	SkillAssessment	2048	Created	Admin	2026-09-10 16:44:32.930209	Created Skill Rating 4 (Avg Cycle Time: 29s)
573	SkillAssessment	2049	Created	Admin	2026-09-10 16:44:32.943763	Created Skill Rating 4 (Avg Cycle Time: 71s)
574	SkillAssessment	2050	Created	Admin	2026-09-10 16:44:32.954192	Created Skill Rating 3 (Avg Cycle Time: 29s)
575	SkillAssessment	2051	Created	Admin	2026-09-10 16:44:32.966056	Created Skill Rating 4 (Avg Cycle Time: 21s)
576	SkillAssessment	2052	Created	Admin	2026-09-10 16:44:32.976573	Created Skill Rating 3 (Avg Cycle Time: 24s)
577	SkillAssessment	2053	Created	Admin	2026-09-10 16:44:32.98624	Created Skill Rating 2 (Avg Cycle Time: 30s)
578	SkillAssessment	2054	Created	Admin	2026-09-10 16:44:32.996759	Created Skill Rating 3 (Avg Cycle Time: 25s)
579	SkillAssessment	2055	Created	Admin	2026-09-10 16:44:33.006828	Created Skill Rating 3 (Avg Cycle Time: 24s)
580	SkillAssessment	2056	Created	Admin	2026-09-10 16:44:33.015924	Created Skill Rating 2 (Avg Cycle Time: 30s)
581	SkillAssessment	2057	Created	Admin	2026-09-10 16:44:33.025817	Created Skill Rating 3 (Avg Cycle Time: 24s)
582	SkillAssessment	2058	Created	Admin	2026-09-10 16:44:33.035978	Created Skill Rating 3 (Avg Cycle Time: 24s)
583	SkillAssessment	2059	Created	Admin	2026-09-10 16:44:33.046714	Created Skill Rating 2 (Avg Cycle Time: 29s)
584	SkillAssessment	2060	Created	Admin	2026-09-10 16:44:33.055668	Created Skill Rating 2 (Avg Cycle Time: 30s)
585	SkillAssessment	2061	Created	Admin	2026-09-10 16:44:33.077909	Created Skill Rating 3 (Avg Cycle Time: 28s)
586	SkillAssessment	2062	Created	Admin	2026-09-10 16:44:33.089981	Created Skill Rating 4 (Avg Cycle Time: 38s)
587	SkillAssessment	2063	Created	Admin	2026-09-10 16:44:33.100265	Created Skill Rating 4 (Avg Cycle Time: 20s)
588	SkillAssessment	2064	Created	Admin	2026-09-10 16:44:33.11031	Created Skill Rating 3 (Avg Cycle Time: 53s)
589	SkillAssessment	2065	Created	Admin	2026-09-10 16:44:33.120898	Created Skill Rating 4 (Avg Cycle Time: 25s)
590	SkillAssessment	2066	Created	Admin	2026-09-10 16:44:33.130965	Created Skill Rating 4 (Avg Cycle Time: 30s)
591	SkillAssessment	2067	Created	Admin	2026-09-10 16:44:33.140256	Created Skill Rating 5 (Avg Cycle Time: 59s)
592	SkillAssessment	2068	Created	Admin	2026-09-10 16:44:33.150122	Created Skill Rating 5 (Avg Cycle Time: 21s)
593	SkillAssessment	2069	Created	Admin	2026-09-10 16:44:33.160159	Created Skill Rating 3 (Avg Cycle Time: 24s)
594	SkillAssessment	2070	Created	Admin	2026-09-10 16:44:33.166672	Created Skill Rating 3 (Avg Cycle Time: 24s)
595	SkillAssessment	2071	Created	Admin	2026-09-10 16:44:33.176601	Created Skill Rating 2 (Avg Cycle Time: 30s)
596	SkillAssessment	2072	Created	Admin	2026-09-10 16:44:33.184661	Created Skill Rating 2 (Avg Cycle Time: 29s)
597	SkillAssessment	2073	Created	Admin	2026-09-10 16:44:33.19416	Created Skill Rating 3 (Avg Cycle Time: 24s)
598	SkillAssessment	2074	Created	Admin	2026-09-10 16:44:33.204026	Created Skill Rating 3 (Avg Cycle Time: 24s)
599	SkillAssessment	2075	Created	Admin	2026-09-10 16:44:33.212947	Created Skill Rating 2 (Avg Cycle Time: 30s)
600	SkillAssessment	2076	Created	Admin	2026-09-10 16:44:33.220939	Created Skill Rating 2 (Avg Cycle Time: 29s)
601	SkillAssessment	2077	Created	Admin	2026-09-10 16:44:33.22899	Created Skill Rating 3 (Avg Cycle Time: 25s)
602	SkillAssessment	2078	Created	Admin	2026-09-10 16:44:33.240169	Created Skill Rating 2 (Avg Cycle Time: 29s)
603	SkillAssessment	2079	Created	Admin	2026-09-10 16:44:33.251244	Created Skill Rating 3 (Avg Cycle Time: 27s)
604	SkillAssessment	2080	Created	Admin	2026-09-10 16:44:33.26223	Created Skill Rating 4 (Avg Cycle Time: 38s)
605	SkillAssessment	2081	Created	Admin	2026-09-10 16:44:33.270746	Created Skill Rating 2 (Avg Cycle Time: 29s)
606	SkillAssessment	2082	Created	Admin	2026-09-10 16:44:33.283019	Created Skill Rating 4 (Avg Cycle Time: 43s)
607	SkillAssessment	2083	Created	Admin	2026-09-10 16:44:33.295481	Created Skill Rating 4 (Avg Cycle Time: 25s)
608	SkillAssessment	2084	Created	Admin	2026-09-10 16:44:33.304056	Created Skill Rating 4 (Avg Cycle Time: 30s)
609	SkillAssessment	2085	Created	Admin	2026-09-10 16:44:33.315996	Created Skill Rating 3 (Avg Cycle Time: 83s)
610	SkillAssessment	2086	Created	Admin	2026-09-10 16:44:33.328051	Created Skill Rating 3 (Avg Cycle Time: 29s)
611	SkillAssessment	2087	Created	Admin	2026-09-10 16:44:33.338097	Created Skill Rating 3 (Avg Cycle Time: 24s)
612	SkillAssessment	2088	Created	Admin	2026-09-10 16:44:33.346202	Created Skill Rating 3 (Avg Cycle Time: 24s)
613	SkillAssessment	2089	Created	Admin	2026-09-10 16:44:33.3589	Created Skill Rating 3 (Avg Cycle Time: 24s)
614	SkillAssessment	2090	Created	Admin	2026-09-10 16:44:33.366752	Created Skill Rating 3 (Avg Cycle Time: 25s)
615	SkillAssessment	2091	Created	Admin	2026-09-10 16:44:33.377853	Created Skill Rating 3 (Avg Cycle Time: 24s)
2268	Notification	7	Updated	Admin	2026-09-10 16:53:30.032825	Updated Notification #7
616	SkillAssessment	2092	Created	Admin	2026-09-10 16:44:33.384902	Created Skill Rating 2 (Avg Cycle Time: 30s)
617	SkillAssessment	2093	Created	Admin	2026-09-10 16:44:33.397189	Created Skill Rating 2 (Avg Cycle Time: 29s)
619	SkillAssessment	2095	Created	Admin	2026-09-10 16:44:33.415315	Created Skill Rating 2 (Avg Cycle Time: 30s)
620	SkillAssessment	2096	Created	Admin	2026-09-10 16:44:33.427171	Created Skill Rating 2 (Avg Cycle Time: 29s)
621	SkillAssessment	2097	Created	Admin	2026-09-10 16:44:33.451769	Created Skill Rating 3 (Avg Cycle Time: 27s)
623	SkillAssessment	2099	Created	Admin	2026-09-10 16:44:33.491792	Created Skill Rating 3 (Avg Cycle Time: 24s)
624	SkillAssessment	2100	Created	Admin	2026-09-10 16:44:33.51522	Created Skill Rating 4 (Avg Cycle Time: 44s)
626	SkillAssessment	2102	Created	Admin	2026-09-10 16:44:33.571839	Created Skill Rating 4 (Avg Cycle Time: 29s)
627	SkillAssessment	2103	Created	Admin	2026-09-10 16:44:33.611828	Created Skill Rating 4 (Avg Cycle Time: 71s)
629	SkillAssessment	2105	Created	Admin	2026-09-10 16:44:33.659142	Created Skill Rating 3 (Avg Cycle Time: 25s)
630	SkillAssessment	2106	Created	Admin	2026-09-10 16:44:33.682195	Created Skill Rating 2 (Avg Cycle Time: 30s)
631	SkillAssessment	2107	Created	Admin	2026-09-10 16:44:33.704035	Created Skill Rating 3 (Avg Cycle Time: 24s)
633	SkillAssessment	2109	Created	Admin	2026-09-10 16:44:33.742805	Created Skill Rating 3 (Avg Cycle Time: 24s)
634	SkillAssessment	2110	Created	Admin	2026-09-10 16:44:33.759999	Created Skill Rating 2 (Avg Cycle Time: 29s)
636	SkillAssessment	2112	Created	Admin	2026-09-10 16:44:33.800142	Created Skill Rating 3 (Avg Cycle Time: 24s)
637	SkillAssessment	2113	Created	Admin	2026-09-10 16:44:33.818186	Created Skill Rating 3 (Avg Cycle Time: 25s)
639	SkillAssessment	2115	Created	Admin	2026-09-10 16:44:33.860136	Created Skill Rating 4 (Avg Cycle Time: 24s)
640	SkillAssessment	2116	Created	Admin	2026-09-10 16:44:33.879222	Created Skill Rating 4 (Avg Cycle Time: 38s)
641	SkillAssessment	2117	Created	Admin	2026-09-10 16:44:33.898792	Created Skill Rating 3 (Avg Cycle Time: 24s)
643	SkillAssessment	2119	Created	Admin	2026-09-10 16:44:33.93468	Created Skill Rating 4 (Avg Cycle Time: 25s)
644	SkillAssessment	2120	Created	Admin	2026-09-10 16:44:33.953079	Created Skill Rating 4 (Avg Cycle Time: 29s)
646	SkillAssessment	2122	Created	Admin	2026-09-10 16:44:33.984872	Created Skill Rating 5 (Avg Cycle Time: 20s)
647	SkillAssessment	2123	Created	Admin	2026-09-10 16:44:33.999937	Created Skill Rating 3 (Avg Cycle Time: 24s)
649	SkillAssessment	2125	Created	Admin	2026-09-10 16:44:34.028179	Created Skill Rating 3 (Avg Cycle Time: 24s)
650	SkillAssessment	2126	Created	Admin	2026-09-10 16:44:34.044009	Created Skill Rating 2 (Avg Cycle Time: 29s)
651	SkillAssessment	2127	Created	Admin	2026-09-10 16:44:34.059455	Created Skill Rating 2 (Avg Cycle Time: 29s)
653	SkillAssessment	2129	Created	Admin	2026-09-10 16:44:34.084169	Created Skill Rating 2 (Avg Cycle Time: 29s)
654	SkillAssessment	2130	Created	Admin	2026-09-10 16:44:34.097246	Created Skill Rating 3 (Avg Cycle Time: 24s)
656	SkillAssessment	2132	Created	Admin	2026-09-10 16:44:34.117959	Created Skill Rating 2 (Avg Cycle Time: 30s)
657	SkillAssessment	2133	Created	Admin	2026-09-10 16:44:34.130066	Created Skill Rating 5 (Avg Cycle Time: 20s)
659	SkillAssessment	2135	Created	Admin	2026-09-10 16:44:34.164907	Created Skill Rating 5 (Avg Cycle Time: 17s)
660	SkillAssessment	2136	Created	Admin	2026-09-10 16:44:34.176976	Created Skill Rating 5 (Avg Cycle Time: 37s)
661	SkillAssessment	2137	Created	Admin	2026-09-10 16:44:34.188156	Created Skill Rating 5 (Avg Cycle Time: 20s)
663	SkillAssessment	2139	Created	Admin	2026-09-10 16:44:34.214066	Created Skill Rating 5 (Avg Cycle Time: 59s)
664	SkillAssessment	2140	Created	Admin	2026-09-10 16:44:34.227873	Created Skill Rating 5 (Avg Cycle Time: 21s)
666	SkillAssessment	2142	Created	Admin	2026-09-10 16:44:34.26546	Created Skill Rating 4 (Avg Cycle Time: 20s)
667	SkillAssessment	2143	Created	Admin	2026-09-10 16:44:34.281995	Created Skill Rating 3 (Avg Cycle Time: 25s)
669	SkillAssessment	2145	Created	Admin	2026-09-10 16:44:34.316365	Created Skill Rating 3 (Avg Cycle Time: 24s)
670	SkillAssessment	2146	Created	Admin	2026-09-10 16:44:34.331882	Created Skill Rating 5 (Avg Cycle Time: 18s)
671	SkillAssessment	2147	Created	Admin	2026-09-10 16:44:34.346756	Created Skill Rating 5 (Avg Cycle Time: 17s)
673	SkillAssessment	2149	Created	Admin	2026-09-10 16:44:34.376513	Created Skill Rating 3 (Avg Cycle Time: 25s)
674	SkillAssessment	2150	Created	Admin	2026-09-10 16:44:34.384119	Created Skill Rating 4 (Avg Cycle Time: 20s)
676	SkillAssessment	2152	Created	Admin	2026-09-10 16:44:34.402365	Created Skill Rating 2 (Avg Cycle Time: 54s)
677	SkillAssessment	2153	Created	Admin	2026-09-10 16:44:34.409053	Created Skill Rating 5 (Avg Cycle Time: 17s)
679	SkillAssessment	2155	Created	Admin	2026-09-10 16:44:34.428168	Created Skill Rating 3 (Avg Cycle Time: 29s)
680	SkillAssessment	2156	Created	Admin	2026-09-10 16:44:34.437024	Created Skill Rating 3 (Avg Cycle Time: 35s)
681	SkillAssessment	2157	Created	Admin	2026-09-10 16:44:34.446675	Created Skill Rating 2 (Avg Cycle Time: 100s)
683	SkillAssessment	2159	Created	Admin	2026-09-10 16:44:34.463834	Created Skill Rating 5 (Avg Cycle Time: 17s)
684	SkillAssessment	2160	Created	Admin	2026-09-10 16:44:34.47388	Created Skill Rating 2 (Avg Cycle Time: 29s)
686	SkillAssessment	2162	Created	Admin	2026-09-10 16:44:34.488834	Created Skill Rating 2 (Avg Cycle Time: 30s)
687	SkillAssessment	2163	Created	Admin	2026-09-10 16:44:34.496671	Created Skill Rating 3 (Avg Cycle Time: 25s)
689	SkillAssessment	2165	Created	Admin	2026-09-10 16:44:34.511197	Created Skill Rating 2 (Avg Cycle Time: 29s)
690	SkillAssessment	2166	Created	Admin	2026-09-10 16:44:34.51708	Created Skill Rating 2 (Avg Cycle Time: 29s)
691	SkillAssessment	2167	Created	Admin	2026-09-10 16:44:34.527892	Created Skill Rating 3 (Avg Cycle Time: 25s)
693	SkillAssessment	2169	Created	Admin	2026-09-10 16:44:34.544523	Created Skill Rating 4 (Avg Cycle Time: 24s)
694	SkillAssessment	2170	Created	Admin	2026-09-10 16:44:34.561911	Created Skill Rating 3 (Avg Cycle Time: 45s)
696	SkillAssessment	2172	Created	Admin	2026-09-10 16:44:34.578288	Created Skill Rating 3 (Avg Cycle Time: 53s)
697	SkillAssessment	2173	Created	Admin	2026-09-10 16:44:34.584825	Created Skill Rating 4 (Avg Cycle Time: 24s)
699	SkillAssessment	2175	Created	Admin	2026-09-10 16:44:34.601053	Created Skill Rating 4 (Avg Cycle Time: 71s)
700	SkillAssessment	2176	Created	Admin	2026-09-10 16:44:34.610698	Created Skill Rating 4 (Avg Cycle Time: 25s)
701	SkillAssessment	2177	Created	Admin	2026-09-10 16:44:34.617212	Created Skill Rating 4 (Avg Cycle Time: 20s)
2297	LinePlan	4	Updated	Admin	2026-09-11 10:13:13.675114	Updated LinePlan #4
618	SkillAssessment	2094	Created	Admin	2026-09-10 16:44:33.40615	Created Skill Rating 3 (Avg Cycle Time: 25s)
622	SkillAssessment	2098	Created	Admin	2026-09-10 16:44:33.471935	Created Skill Rating 4 (Avg Cycle Time: 38s)
625	SkillAssessment	2101	Created	Admin	2026-09-10 16:44:33.548925	Created Skill Rating 4 (Avg Cycle Time: 24s)
628	SkillAssessment	2104	Created	Admin	2026-09-10 16:44:33.63914	Created Skill Rating 4 (Avg Cycle Time: 25s)
632	SkillAssessment	2108	Created	Admin	2026-09-10 16:44:33.725807	Created Skill Rating 3 (Avg Cycle Time: 24s)
635	SkillAssessment	2111	Created	Admin	2026-09-10 16:44:33.7809	Created Skill Rating 3 (Avg Cycle Time: 25s)
638	SkillAssessment	2114	Created	Admin	2026-09-10 16:44:33.8345	Created Skill Rating 2 (Avg Cycle Time: 29s)
642	SkillAssessment	2118	Created	Admin	2026-09-10 16:44:33.918389	Created Skill Rating 4 (Avg Cycle Time: 44s)
645	SkillAssessment	2121	Created	Admin	2026-09-10 16:44:33.967946	Created Skill Rating 5 (Avg Cycle Time: 60s)
648	SkillAssessment	2124	Created	Admin	2026-09-10 16:44:34.01457	Created Skill Rating 2 (Avg Cycle Time: 30s)
652	SkillAssessment	2128	Created	Admin	2026-09-10 16:44:34.074101	Created Skill Rating 3 (Avg Cycle Time: 24s)
655	SkillAssessment	2131	Created	Admin	2026-09-10 16:44:34.109322	Created Skill Rating 2 (Avg Cycle Time: 30s)
658	SkillAssessment	2134	Created	Admin	2026-09-10 16:44:34.146847	Created Skill Rating 4 (Avg Cycle Time: 38s)
662	SkillAssessment	2138	Created	Admin	2026-09-10 16:44:34.201234	Created Skill Rating 4 (Avg Cycle Time: 30s)
665	SkillAssessment	2141	Created	Admin	2026-09-10 16:44:34.253808	Created Skill Rating 4 (Avg Cycle Time: 20s)
668	SkillAssessment	2144	Created	Admin	2026-09-10 16:44:34.295254	Created Skill Rating 5 (Avg Cycle Time: 18s)
672	SkillAssessment	2148	Created	Admin	2026-09-10 16:44:34.361096	Created Skill Rating 4 (Avg Cycle Time: 20s)
675	SkillAssessment	2151	Created	Admin	2026-09-10 16:44:34.395292	Created Skill Rating 2 (Avg Cycle Time: 34s)
678	SkillAssessment	2154	Created	Admin	2026-09-10 16:44:34.416715	Created Skill Rating 3 (Avg Cycle Time: 52s)
682	SkillAssessment	2158	Created	Admin	2026-09-10 16:44:34.45721	Created Skill Rating 2 (Avg Cycle Time: 34s)
685	SkillAssessment	2161	Created	Admin	2026-09-10 16:44:34.480139	Created Skill Rating 3 (Avg Cycle Time: 24s)
688	SkillAssessment	2164	Created	Admin	2026-09-10 16:44:34.503912	Created Skill Rating 2 (Avg Cycle Time: 29s)
692	SkillAssessment	2168	Created	Admin	2026-09-10 16:44:34.533886	Created Skill Rating 2 (Avg Cycle Time: 29s)
695	SkillAssessment	2171	Created	Admin	2026-09-10 16:44:34.572192	Created Skill Rating 4 (Avg Cycle Time: 21s)
698	SkillAssessment	2174	Created	Admin	2026-09-10 16:44:34.594382	Created Skill Rating 4 (Avg Cycle Time: 29s)
702	SkillAssessment	2178	Created	Admin	2026-09-10 16:44:34.625904	Created Skill Rating 2 (Avg Cycle Time: 29s)
705	SkillAssessment	2181	Created	Admin	2026-09-10 16:44:34.676707	Created Skill Rating 2 (Avg Cycle Time: 29s)
708	SkillAssessment	2184	Created	Admin	2026-09-10 16:44:34.724584	Created Skill Rating 3 (Avg Cycle Time: 24s)
712	SkillAssessment	2188	Created	Admin	2026-09-10 16:44:34.754192	Created Skill Rating 5 (Avg Cycle Time: 32s)
715	SkillAssessment	2191	Created	Admin	2026-09-10 16:44:34.774607	Created Skill Rating 5 (Avg Cycle Time: 20s)
718	SkillAssessment	2194	Created	Admin	2026-09-10 16:44:34.793968	Created Skill Rating 5 (Avg Cycle Time: 21s)
722	SkillAssessment	2198	Created	Admin	2026-09-10 16:44:34.819065	Created Skill Rating 5 (Avg Cycle Time: 17s)
725	SkillAssessment	2201	Created	Admin	2026-09-10 16:44:34.837265	Created Skill Rating 5 (Avg Cycle Time: 18s)
728	SkillAssessment	2204	Created	Admin	2026-09-10 16:44:34.856385	Created Skill Rating 4 (Avg Cycle Time: 21s)
732	SkillAssessment	2208	Created	Admin	2026-09-10 16:44:34.885889	Created Skill Rating 3 (Avg Cycle Time: 52s)
735	SkillAssessment	2211	Created	Admin	2026-09-10 16:44:34.909021	Created Skill Rating 2 (Avg Cycle Time: 100s)
738	SkillAssessment	2214	Created	Admin	2026-09-10 16:44:34.929126	Created Skill Rating 3 (Avg Cycle Time: 24s)
742	SkillAssessment	2218	Created	Admin	2026-09-10 16:44:34.951812	Created Skill Rating 2 (Avg Cycle Time: 30s)
745	SkillAssessment	2221	Created	Admin	2026-09-10 16:44:34.970459	Created Skill Rating 2 (Avg Cycle Time: 29s)
748	SkillAssessment	2224	Created	Admin	2026-09-10 16:44:34.98986	Created Skill Rating 3 (Avg Cycle Time: 45s)
752	SkillAssessment	2228	Created	Admin	2026-09-10 16:44:35.020762	Created Skill Rating 4 (Avg Cycle Time: 30s)
755	SkillAssessment	2231	Created	Admin	2026-09-10 16:44:35.043037	Created Skill Rating 3 (Avg Cycle Time: 24s)
758	SkillAssessment	2234	Created	Admin	2026-09-10 16:44:35.062886	Created Skill Rating 2 (Avg Cycle Time: 29s)
762	SkillAssessment	2238	Created	Admin	2026-09-10 16:44:35.087937	Created Skill Rating 3 (Avg Cycle Time: 24s)
765	SkillAssessment	2241	Created	Admin	2026-09-10 16:44:35.111996	Created Skill Rating 1 (Avg Cycle Time: 43s)
768	SkillAssessment	2244	Created	Admin	2026-09-10 16:44:35.131236	Created Skill Rating 1 (Avg Cycle Time: 79s)
772	SkillAssessment	2248	Created	Admin	2026-09-10 16:44:35.160244	Created Skill Rating 1 (Avg Cycle Time: 44s)
775	SkillAssessment	2251	Created	Admin	2026-09-10 16:44:35.179121	Created Skill Rating 3 (Avg Cycle Time: 24s)
778	SkillAssessment	2254	Created	Admin	2026-09-10 16:44:35.195915	Created Skill Rating 1 (Avg Cycle Time: 37s)
782	SkillAssessment	2258	Created	Admin	2026-09-10 16:44:35.222816	Created Skill Rating 3 (Avg Cycle Time: 24s)
785	SkillAssessment	2261	Created	Admin	2026-09-10 16:44:35.240282	Created Skill Rating 2 (Avg Cycle Time: 29s)
788	SkillAssessment	2264	Created	Admin	2026-09-10 16:44:35.262246	Created Skill Rating 2 (Avg Cycle Time: 42s)
792	SkillAssessment	2268	Created	Admin	2026-09-10 16:44:35.289986	Created Skill Rating 5 (Avg Cycle Time: 17s)
795	SkillAssessment	2271	Created	Admin	2026-09-10 16:44:35.305673	Created Skill Rating 4 (Avg Cycle Time: 20s)
798	SkillAssessment	2274	Created	Admin	2026-09-10 16:44:35.319449	Created Skill Rating 4 (Avg Cycle Time: 20s)
802	SkillAssessment	2278	Created	Admin	2026-09-10 16:44:35.344584	Created Skill Rating 4 (Avg Cycle Time: 38s)
805	SkillAssessment	2281	Created	Admin	2026-09-10 16:44:35.36039	Created Skill Rating 5 (Avg Cycle Time: 21s)
808	SkillAssessment	2284	Created	Admin	2026-09-10 16:44:35.379213	Created Skill Rating 4 (Avg Cycle Time: 24s)
812	SkillAssessment	2288	Created	Admin	2026-09-10 16:44:35.400161	Created Skill Rating 5 (Avg Cycle Time: 17s)
815	SkillAssessment	2291	Created	Admin	2026-09-10 16:44:35.418019	Created Skill Rating 5 (Avg Cycle Time: 17s)
818	SkillAssessment	2294	Created	Admin	2026-09-10 16:44:35.435223	Created Skill Rating 3 (Avg Cycle Time: 24s)
2305	CapacityPlan	1	Created	Admin	2026-09-11 11:24:37.292134	Created CapacityPlan #1
703	SkillAssessment	2179	Created	Admin	2026-09-10 16:44:34.6332	Created Skill Rating 2 (Avg Cycle Time: 30s)
704	SkillAssessment	2180	Created	Admin	2026-09-10 16:44:34.644032	Created Skill Rating 3 (Avg Cycle Time: 24s)
706	SkillAssessment	2182	Created	Admin	2026-09-10 16:44:34.709575	Created Skill Rating 2 (Avg Cycle Time: 29s)
707	SkillAssessment	2183	Created	Admin	2026-09-10 16:44:34.71598	Created Skill Rating 3 (Avg Cycle Time: 25s)
709	SkillAssessment	2185	Created	Admin	2026-09-10 16:44:34.730381	Created Skill Rating 2 (Avg Cycle Time: 29s)
710	SkillAssessment	2186	Created	Admin	2026-09-10 16:44:34.740245	Created Skill Rating 3 (Avg Cycle Time: 25s)
711	SkillAssessment	2187	Created	Admin	2026-09-10 16:44:34.747096	Created Skill Rating 5 (Avg Cycle Time: 19s)
713	SkillAssessment	2189	Created	Admin	2026-09-10 16:44:34.762008	Created Skill Rating 5 (Avg Cycle Time: 17s)
714	SkillAssessment	2190	Created	Admin	2026-09-10 16:44:34.766534	Created Skill Rating 4 (Avg Cycle Time: 43s)
716	SkillAssessment	2192	Created	Admin	2026-09-10 16:44:34.781078	Created Skill Rating 4 (Avg Cycle Time: 29s)
717	SkillAssessment	2193	Created	Admin	2026-09-10 16:44:34.788934	Created Skill Rating 4 (Avg Cycle Time: 71s)
719	SkillAssessment	2195	Created	Admin	2026-09-10 16:44:34.800424	Created Skill Rating 5 (Avg Cycle Time: 17s)
720	SkillAssessment	2196	Created	Admin	2026-09-10 16:44:34.80789	Created Skill Rating 5 (Avg Cycle Time: 17s)
721	SkillAssessment	2197	Created	Admin	2026-09-10 16:44:34.812916	Created Skill Rating 3 (Avg Cycle Time: 24s)
723	SkillAssessment	2199	Created	Admin	2026-09-10 16:44:34.82614	Created Skill Rating 4 (Avg Cycle Time: 21s)
724	SkillAssessment	2200	Created	Admin	2026-09-10 16:44:34.830141	Created Skill Rating 4 (Avg Cycle Time: 21s)
726	SkillAssessment	2202	Created	Admin	2026-09-10 16:44:34.84379	Created Skill Rating 3 (Avg Cycle Time: 25s)
727	SkillAssessment	2203	Created	Admin	2026-09-10 16:44:34.847808	Created Skill Rating 4 (Avg Cycle Time: 21s)
729	SkillAssessment	2205	Created	Admin	2026-09-10 16:44:34.863858	Created Skill Rating 3 (Avg Cycle Time: 28s)
730	SkillAssessment	2206	Created	Admin	2026-09-10 16:44:34.871908	Created Skill Rating 2 (Avg Cycle Time: 54s)
731	SkillAssessment	2207	Created	Admin	2026-09-10 16:44:34.879012	Created Skill Rating 5 (Avg Cycle Time: 18s)
733	SkillAssessment	2209	Created	Admin	2026-09-10 16:44:34.893896	Created Skill Rating 2 (Avg Cycle Time: 35s)
734	SkillAssessment	2210	Created	Admin	2026-09-10 16:44:34.900961	Created Skill Rating 2 (Avg Cycle Time: 42s)
736	SkillAssessment	2212	Created	Admin	2026-09-10 16:44:34.915485	Created Skill Rating 2 (Avg Cycle Time: 35s)
737	SkillAssessment	2213	Created	Admin	2026-09-10 16:44:34.925112	Created Skill Rating 3 (Avg Cycle Time: 24s)
739	SkillAssessment	2215	Created	Admin	2026-09-10 16:44:34.934172	Created Skill Rating 2 (Avg Cycle Time: 29s)
740	SkillAssessment	2216	Created	Admin	2026-09-10 16:44:34.94049	Created Skill Rating 2 (Avg Cycle Time: 30s)
741	SkillAssessment	2217	Created	Admin	2026-09-10 16:44:34.946807	Created Skill Rating 3 (Avg Cycle Time: 24s)
743	SkillAssessment	2219	Created	Admin	2026-09-10 16:44:34.959121	Created Skill Rating 3 (Avg Cycle Time: 25s)
744	SkillAssessment	2220	Created	Admin	2026-09-10 16:44:34.964713	Created Skill Rating 2 (Avg Cycle Time: 29s)
746	SkillAssessment	2222	Created	Admin	2026-09-10 16:44:34.976812	Created Skill Rating 2 (Avg Cycle Time: 29s)
747	SkillAssessment	2223	Created	Admin	2026-09-10 16:44:34.98262	Created Skill Rating 3 (Avg Cycle Time: 27s)
749	SkillAssessment	2225	Created	Admin	2026-09-10 16:44:34.999169	Created Skill Rating 4 (Avg Cycle Time: 20s)
750	SkillAssessment	2226	Created	Admin	2026-09-10 16:44:35.007942	Created Skill Rating 3 (Avg Cycle Time: 52s)
751	SkillAssessment	2227	Created	Admin	2026-09-10 16:44:35.014078	Created Skill Rating 3 (Avg Cycle Time: 28s)
753	SkillAssessment	2229	Created	Admin	2026-09-10 16:44:35.02711	Created Skill Rating 5 (Avg Cycle Time: 59s)
754	SkillAssessment	2230	Created	Admin	2026-09-10 16:44:35.03247	Created Skill Rating 5 (Avg Cycle Time: 21s)
756	SkillAssessment	2232	Created	Admin	2026-09-10 16:44:35.048159	Created Skill Rating 3 (Avg Cycle Time: 24s)
757	SkillAssessment	2233	Created	Admin	2026-09-10 16:44:35.055295	Created Skill Rating 3 (Avg Cycle Time: 24s)
759	SkillAssessment	2235	Created	Admin	2026-09-10 16:44:35.068231	Created Skill Rating 3 (Avg Cycle Time: 25s)
760	SkillAssessment	2236	Created	Admin	2026-09-10 16:44:35.075263	Created Skill Rating 3 (Avg Cycle Time: 24s)
761	SkillAssessment	2237	Created	Admin	2026-09-10 16:44:35.080829	Created Skill Rating 2 (Avg Cycle Time: 29s)
763	SkillAssessment	2239	Created	Admin	2026-09-10 16:44:35.09298	Created Skill Rating 2 (Avg Cycle Time: 30s)
764	SkillAssessment	2240	Created	Admin	2026-09-10 16:44:35.103899	Created Skill Rating 3 (Avg Cycle Time: 24s)
766	SkillAssessment	2242	Created	Admin	2026-09-10 16:44:35.118203	Created Skill Rating 1 (Avg Cycle Time: 68s)
767	SkillAssessment	2243	Created	Admin	2026-09-10 16:44:35.125584	Created Skill Rating 1 (Avg Cycle Time: 36s)
769	SkillAssessment	2245	Created	Admin	2026-09-10 16:44:35.138262	Created Skill Rating 1 (Avg Cycle Time: 44s)
770	SkillAssessment	2246	Created	Admin	2026-09-10 16:44:35.146059	Created Skill Rating 2 (Avg Cycle Time: 42s)
771	SkillAssessment	2247	Created	Admin	2026-09-10 16:44:35.151996	Created Skill Rating 2 (Avg Cycle Time: 101s)
773	SkillAssessment	2249	Created	Admin	2026-09-10 16:44:35.164795	Created Skill Rating 1 (Avg Cycle Time: 37s)
774	SkillAssessment	2250	Created	Admin	2026-09-10 16:44:35.171864	Created Skill Rating 1 (Avg Cycle Time: 36s)
776	SkillAssessment	2252	Created	Admin	2026-09-10 16:44:35.18412	Created Skill Rating 1 (Avg Cycle Time: 36s)
777	SkillAssessment	2253	Created	Admin	2026-09-10 16:44:35.191179	Created Skill Rating 3 (Avg Cycle Time: 24s)
779	SkillAssessment	2255	Created	Admin	2026-09-10 16:44:35.205521	Created Skill Rating 1 (Avg Cycle Time: 36s)
780	SkillAssessment	2256	Created	Admin	2026-09-10 16:44:35.211086	Created Skill Rating 3 (Avg Cycle Time: 25s)
781	SkillAssessment	2257	Created	Admin	2026-09-10 16:44:35.215672	Created Skill Rating 3 (Avg Cycle Time: 24s)
783	SkillAssessment	2259	Created	Admin	2026-09-10 16:44:35.22812	Created Skill Rating 3 (Avg Cycle Time: 28s)
784	SkillAssessment	2260	Created	Admin	2026-09-10 16:44:35.232649	Created Skill Rating 3 (Avg Cycle Time: 45s)
786	SkillAssessment	2262	Created	Admin	2026-09-10 16:44:35.248903	Created Skill Rating 2 (Avg Cycle Time: 64s)
787	SkillAssessment	2263	Created	Admin	2026-09-10 16:44:35.25723	Created Skill Rating 3 (Avg Cycle Time: 28s)
789	SkillAssessment	2265	Created	Admin	2026-09-10 16:44:35.270888	Created Skill Rating 2 (Avg Cycle Time: 101s)
2306	LineDesign	1	Created	Admin	2026-09-11 11:24:37.372581	Created LineDesign #1
790	SkillAssessment	2266	Created	Admin	2026-09-10 16:44:35.278361	Created Skill Rating 3 (Avg Cycle Time: 29s)
791	SkillAssessment	2267	Created	Admin	2026-09-10 16:44:35.283884	Created Skill Rating 2 (Avg Cycle Time: 30s)
793	SkillAssessment	2269	Created	Admin	2026-09-10 16:44:35.294588	Created Skill Rating 3 (Avg Cycle Time: 24s)
794	SkillAssessment	2270	Created	Admin	2026-09-10 16:44:35.299306	Created Skill Rating 5 (Avg Cycle Time: 18s)
796	SkillAssessment	2272	Created	Admin	2026-09-10 16:44:35.30937	Created Skill Rating 5 (Avg Cycle Time: 18s)
797	SkillAssessment	2273	Created	Admin	2026-09-10 16:44:35.314021	Created Skill Rating 5 (Avg Cycle Time: 18s)
799	SkillAssessment	2275	Created	Admin	2026-09-10 16:44:35.324759	Created Skill Rating 3 (Avg Cycle Time: 25s)
800	SkillAssessment	2276	Created	Admin	2026-09-10 16:44:35.328573	Created Skill Rating 3 (Avg Cycle Time: 24s)
801	SkillAssessment	2277	Created	Admin	2026-09-10 16:44:35.334971	Created Skill Rating 5 (Avg Cycle Time: 20s)
803	SkillAssessment	2279	Created	Admin	2026-09-10 16:44:35.349383	Created Skill Rating 5 (Avg Cycle Time: 17s)
804	SkillAssessment	2280	Created	Admin	2026-09-10 16:44:35.356685	Created Skill Rating 4 (Avg Cycle Time: 44s)
806	SkillAssessment	2282	Created	Admin	2026-09-10 16:44:35.365807	Created Skill Rating 5 (Avg Cycle Time: 25s)
807	SkillAssessment	2283	Created	Admin	2026-09-10 16:44:35.373801	Created Skill Rating 5 (Avg Cycle Time: 59s)
809	SkillAssessment	2285	Created	Admin	2026-09-10 16:44:35.384975	Created Skill Rating 5 (Avg Cycle Time: 18s)
810	SkillAssessment	2286	Created	Admin	2026-09-10 16:44:35.391042	Created Skill Rating 5 (Avg Cycle Time: 17s)
811	SkillAssessment	2287	Created	Admin	2026-09-10 16:44:35.395151	Created Skill Rating 4 (Avg Cycle Time: 21s)
813	SkillAssessment	2289	Created	Admin	2026-09-10 16:44:35.406664	Created Skill Rating 3 (Avg Cycle Time: 25s)
814	SkillAssessment	2290	Created	Admin	2026-09-10 16:44:35.413215	Created Skill Rating 5 (Avg Cycle Time: 17s)
816	SkillAssessment	2292	Created	Admin	2026-09-10 16:44:35.426448	Created Skill Rating 3 (Avg Cycle Time: 25s)
817	SkillAssessment	2293	Created	Admin	2026-09-10 16:44:35.429996	Created Skill Rating 4 (Avg Cycle Time: 21s)
819	SkillAssessment	2295	Created	Admin	2026-09-10 16:44:35.442236	Created Skill Rating 4 (Avg Cycle Time: 24s)
820	SkillAssessment	2296	Created	Admin	2026-09-10 16:44:35.448291	Created Skill Rating 4 (Avg Cycle Time: 38s)
821	SkillAssessment	2297	Created	Admin	2026-09-10 16:44:35.455328	Created Skill Rating 3 (Avg Cycle Time: 24s)
823	SkillAssessment	2299	Created	Admin	2026-09-10 16:44:35.488277	Created Skill Rating 3 (Avg Cycle Time: 29s)
824	SkillAssessment	2300	Created	Admin	2026-09-10 16:44:35.495026	Created Skill Rating 3 (Avg Cycle Time: 35s)
826	SkillAssessment	2302	Created	Admin	2026-09-10 16:44:35.506442	Created Skill Rating 3 (Avg Cycle Time: 28s)
827	SkillAssessment	2303	Created	Admin	2026-09-10 16:44:35.512976	Created Skill Rating 2 (Avg Cycle Time: 29s)
829	SkillAssessment	2305	Created	Admin	2026-09-10 16:44:35.52667	Created Skill Rating 2 (Avg Cycle Time: 30s)
830	SkillAssessment	2306	Created	Admin	2026-09-10 16:44:35.530219	Created Skill Rating 2 (Avg Cycle Time: 30s)
831	SkillAssessment	2307	Created	Admin	2026-09-10 16:44:35.535381	Created Skill Rating 3 (Avg Cycle Time: 24s)
833	SkillAssessment	2309	Created	Admin	2026-09-10 16:44:35.546499	Created Skill Rating 3 (Avg Cycle Time: 25s)
834	SkillAssessment	2310	Created	Admin	2026-09-10 16:44:35.551196	Created Skill Rating 2 (Avg Cycle Time: 29s)
836	SkillAssessment	2312	Created	Admin	2026-09-10 16:44:35.562272	Created Skill Rating 3 (Avg Cycle Time: 24s)
837	SkillAssessment	2313	Created	Admin	2026-09-10 16:44:35.56697	Created Skill Rating 2 (Avg Cycle Time: 34s)
839	SkillAssessment	2315	Created	Admin	2026-09-10 16:44:35.577985	Created Skill Rating 2 (Avg Cycle Time: 30s)
840	SkillAssessment	2316	Created	Admin	2026-09-10 16:44:35.581996	Created Skill Rating 3 (Avg Cycle Time: 52s)
841	SkillAssessment	2317	Created	Admin	2026-09-10 16:44:35.588728	Created Skill Rating 2 (Avg Cycle Time: 34s)
843	SkillAssessment	2319	Created	Admin	2026-09-10 16:44:35.596451	Created Skill Rating 2 (Avg Cycle Time: 101s)
844	SkillAssessment	2320	Created	Admin	2026-09-10 16:44:35.602058	Created Skill Rating 3 (Avg Cycle Time: 29s)
846	SkillAssessment	2322	Created	Admin	2026-09-10 16:44:35.61311	Created Skill Rating 4 (Avg Cycle Time: 21s)
847	SkillAssessment	2323	Created	Admin	2026-09-10 16:44:35.616744	Created Skill Rating 4 (Avg Cycle Time: 21s)
849	SkillAssessment	2325	Created	Admin	2026-09-10 16:44:35.626263	Created Skill Rating 4 (Avg Cycle Time: 20s)
850	SkillAssessment	2326	Created	Admin	2026-09-10 16:44:35.630981	Created Skill Rating 5 (Avg Cycle Time: 17s)
851	SkillAssessment	2327	Created	Admin	2026-09-10 16:44:35.638106	Created Skill Rating 5 (Avg Cycle Time: 17s)
853	SkillAssessment	2329	Created	Admin	2026-09-10 16:44:35.645904	Created Skill Rating 4 (Avg Cycle Time: 21s)
854	SkillAssessment	2330	Created	Admin	2026-09-10 16:44:35.649903	Created Skill Rating 4 (Avg Cycle Time: 20s)
856	SkillAssessment	2332	Created	Admin	2026-09-10 16:44:35.66076	Created Skill Rating 5 (Avg Cycle Time: 31s)
857	SkillAssessment	2333	Created	Admin	2026-09-10 16:44:35.665376	Created Skill Rating 5 (Avg Cycle Time: 17s)
859	SkillAssessment	2335	Created	Admin	2026-09-10 16:44:35.677931	Created Skill Rating 5 (Avg Cycle Time: 20s)
860	SkillAssessment	2336	Created	Admin	2026-09-10 16:44:35.681682	Created Skill Rating 4 (Avg Cycle Time: 30s)
861	SkillAssessment	2337	Created	Admin	2026-09-10 16:44:35.689086	Created Skill Rating 4 (Avg Cycle Time: 71s)
863	SkillAssessment	2339	Created	Admin	2026-09-10 16:44:35.69837	Created Skill Rating 5 (Avg Cycle Time: 17s)
864	SkillAssessment	2340	Created	Admin	2026-09-10 16:44:35.705518	Created Skill Rating 5 (Avg Cycle Time: 17s)
866	SkillAssessment	2342	Created	Admin	2026-09-10 16:44:35.715382	Created Skill Rating 5 (Avg Cycle Time: 17s)
867	SkillAssessment	2343	Created	Admin	2026-09-10 16:44:35.722007	Created Skill Rating 3 (Avg Cycle Time: 24s)
869	SkillAssessment	2345	Created	Admin	2026-09-10 16:44:35.730395	Created Skill Rating 5 (Avg Cycle Time: 17s)
870	SkillAssessment	2346	Created	Admin	2026-09-10 16:44:35.734574	Created Skill Rating 4 (Avg Cycle Time: 21s)
871	SkillAssessment	2347	Created	Admin	2026-09-10 16:44:35.741223	Created Skill Rating 3 (Avg Cycle Time: 24s)
873	SkillAssessment	2349	Created	Admin	2026-09-10 16:44:35.748922	Created Skill Rating 4 (Avg Cycle Time: 23s)
874	SkillAssessment	2350	Created	Admin	2026-09-10 16:44:35.756077	Created Skill Rating 5 (Avg Cycle Time: 32s)
876	SkillAssessment	2352	Created	Admin	2026-09-10 16:44:35.766773	Created Skill Rating 5 (Avg Cycle Time: 37s)
2308	CapacityPlan	2	Created	Admin	2026-09-11 11:33:32.725922	Created CapacityPlan #2
822	SkillAssessment	2298	Created	Admin	2026-09-10 16:44:35.478158	Created Skill Rating 3 (Avg Cycle Time: 52s)
825	SkillAssessment	2301	Created	Admin	2026-09-10 16:44:35.500034	Created Skill Rating 2 (Avg Cycle Time: 101s)
828	SkillAssessment	2304	Created	Admin	2026-09-10 16:44:35.52016	Created Skill Rating 2 (Avg Cycle Time: 30s)
832	SkillAssessment	2308	Created	Admin	2026-09-10 16:44:35.543019	Created Skill Rating 2 (Avg Cycle Time: 30s)
835	SkillAssessment	2311	Created	Admin	2026-09-10 16:44:35.558174	Created Skill Rating 3 (Avg Cycle Time: 24s)
838	SkillAssessment	2314	Created	Admin	2026-09-10 16:44:35.573889	Created Skill Rating 2 (Avg Cycle Time: 54s)
842	SkillAssessment	2318	Created	Admin	2026-09-10 16:44:35.592824	Created Skill Rating 2 (Avg Cycle Time: 41s)
845	SkillAssessment	2321	Created	Admin	2026-09-10 16:44:35.608352	Created Skill Rating 3 (Avg Cycle Time: 25s)
848	SkillAssessment	2324	Created	Admin	2026-09-10 16:44:35.623088	Created Skill Rating 4 (Avg Cycle Time: 21s)
852	SkillAssessment	2328	Created	Admin	2026-09-10 16:44:35.642206	Created Skill Rating 3 (Avg Cycle Time: 24s)
855	SkillAssessment	2331	Created	Admin	2026-09-10 16:44:35.657069	Created Skill Rating 5 (Avg Cycle Time: 19s)
858	SkillAssessment	2334	Created	Admin	2026-09-10 16:44:35.673043	Created Skill Rating 5 (Avg Cycle Time: 37s)
862	SkillAssessment	2338	Created	Admin	2026-09-10 16:44:35.694048	Created Skill Rating 5 (Avg Cycle Time: 21s)
865	SkillAssessment	2341	Created	Admin	2026-09-10 16:44:35.710235	Created Skill Rating 4 (Avg Cycle Time: 21s)
868	SkillAssessment	2344	Created	Admin	2026-09-10 16:44:35.726706	Created Skill Rating 4 (Avg Cycle Time: 21s)
872	SkillAssessment	2348	Created	Admin	2026-09-10 16:44:35.744927	Created Skill Rating 4 (Avg Cycle Time: 20s)
875	SkillAssessment	2351	Created	Admin	2026-09-10 16:44:35.762231	Created Skill Rating 4 (Avg Cycle Time: 20s)
878	SkillAssessment	2354	Created	Admin	2026-09-10 16:44:35.78034	Created Skill Rating 5 (Avg Cycle Time: 24s)
882	SkillAssessment	2358	Created	Admin	2026-09-10 16:44:35.808868	Created Skill Rating 2 (Avg Cycle Time: 30s)
885	SkillAssessment	2361	Created	Admin	2026-09-10 16:44:35.826047	Created Skill Rating 2 (Avg Cycle Time: 30s)
888	SkillAssessment	2364	Created	Admin	2026-09-10 16:44:35.844158	Created Skill Rating 2 (Avg Cycle Time: 30s)
892	SkillAssessment	2368	Created	Admin	2026-09-10 16:44:35.866891	Created Skill Rating 3 (Avg Cycle Time: 45s)
895	SkillAssessment	2371	Created	Admin	2026-09-10 16:44:35.883783	Created Skill Rating 2 (Avg Cycle Time: 36s)
898	SkillAssessment	2374	Created	Admin	2026-09-10 16:44:35.905117	Created Skill Rating 3 (Avg Cycle Time: 30s)
902	SkillAssessment	2378	Created	Admin	2026-09-10 16:44:35.928244	Created Skill Rating 3 (Avg Cycle Time: 25s)
905	SkillAssessment	2381	Created	Admin	2026-09-10 16:44:35.943813	Created Skill Rating 3 (Avg Cycle Time: 24s)
908	SkillAssessment	2384	Created	Admin	2026-09-10 16:44:35.960649	Created Skill Rating 2 (Avg Cycle Time: 30s)
912	SkillAssessment	2388	Created	Admin	2026-09-10 16:44:35.98106	Created Skill Rating 1 (Avg Cycle Time: 79s)
915	SkillAssessment	2391	Created	Admin	2026-09-10 16:44:35.998061	Created Skill Rating 2 (Avg Cycle Time: 100s)
918	SkillAssessment	2394	Created	Admin	2026-09-10 16:44:36.015765	Created Skill Rating 2 (Avg Cycle Time: 30s)
922	SkillAssessment	2398	Created	Admin	2026-09-10 16:44:36.046616	Created Skill Rating 2 (Avg Cycle Time: 29s)
925	SkillAssessment	2401	Created	Admin	2026-09-10 16:44:36.066979	Created Skill Rating 5 (Avg Cycle Time: 17s)
928	SkillAssessment	2404	Created	Admin	2026-09-10 16:44:36.092732	Created Skill Rating 4 (Avg Cycle Time: 39s)
932	SkillAssessment	2408	Created	Admin	2026-09-10 16:44:36.12295	Created Skill Rating 4 (Avg Cycle Time: 30s)
935	SkillAssessment	2411	Created	Admin	2026-09-10 16:44:36.150892	Created Skill Rating 2 (Avg Cycle Time: 29s)
938	SkillAssessment	2414	Created	Admin	2026-09-10 16:44:36.178189	Created Skill Rating 3 (Avg Cycle Time: 25s)
942	SkillAssessment	2418	Created	Admin	2026-09-10 16:44:36.211867	Created Skill Rating 3 (Avg Cycle Time: 24s)
945	SkillAssessment	2421	Created	Admin	2026-09-10 16:44:36.230911	Created Skill Rating 1 (Avg Cycle Time: 42s)
948	SkillAssessment	2424	Created	Admin	2026-09-10 16:44:36.248932	Created Skill Rating 1 (Avg Cycle Time: 79s)
952	SkillAssessment	2428	Created	Admin	2026-09-10 16:44:36.276286	Created Skill Rating 1 (Avg Cycle Time: 44s)
955	SkillAssessment	2431	Created	Admin	2026-09-10 16:44:36.292992	Created Skill Rating 5 (Avg Cycle Time: 17s)
958	SkillAssessment	2434	Created	Admin	2026-09-10 16:44:36.308108	Created Skill Rating 2 (Avg Cycle Time: 29s)
962	SkillAssessment	2438	Created	Admin	2026-09-10 16:44:36.3266	Created Skill Rating 5 (Avg Cycle Time: 18s)
965	SkillAssessment	2441	Created	Admin	2026-09-10 16:44:36.343101	Created Skill Rating 2 (Avg Cycle Time: 30s)
968	SkillAssessment	2444	Created	Admin	2026-09-10 16:44:36.35844	Created Skill Rating 3 (Avg Cycle Time: 35s)
972	SkillAssessment	2448	Created	Admin	2026-09-10 16:44:36.379347	Created Skill Rating 2 (Avg Cycle Time: 30s)
975	SkillAssessment	2451	Created	Admin	2026-09-10 16:44:36.403971	Created Skill Rating 3 (Avg Cycle Time: 25s)
978	SkillAssessment	2454	Created	Admin	2026-09-10 16:44:36.417005	Created Skill Rating 3 (Avg Cycle Time: 25s)
982	SkillAssessment	2458	Created	Admin	2026-09-10 16:44:36.440835	Created Skill Rating 3 (Avg Cycle Time: 46s)
985	SkillAssessment	2461	Created	Admin	2026-09-10 16:44:36.458907	Created Skill Rating 2 (Avg Cycle Time: 35s)
988	SkillAssessment	2464	Created	Admin	2026-09-10 16:44:36.475551	Created Skill Rating 3 (Avg Cycle Time: 29s)
992	SkillAssessment	2468	Created	Admin	2026-09-10 16:44:36.499185	Created Skill Rating 5 (Avg Cycle Time: 17s)
995	SkillAssessment	2471	Created	Admin	2026-09-10 16:44:36.516907	Created Skill Rating 5 (Avg Cycle Time: 18s)
998	SkillAssessment	2474	Created	Admin	2026-09-10 16:44:36.531794	Created Skill Rating 4 (Avg Cycle Time: 21s)
1002	SkillAssessment	2478	Created	Admin	2026-09-10 16:44:36.559946	Created Skill Rating 2 (Avg Cycle Time: 63s)
1005	SkillAssessment	2481	Created	Admin	2026-09-10 16:44:36.577824	Created Skill Rating 3 (Avg Cycle Time: 84s)
1008	SkillAssessment	2484	Created	Admin	2026-09-10 16:44:36.594007	Created Skill Rating 3 (Avg Cycle Time: 24s)
1012	SkillAssessment	2488	Created	Admin	2026-09-10 16:44:36.614649	Created Skill Rating 2 (Avg Cycle Time: 30s)
1015	SkillAssessment	2491	Created	Admin	2026-09-10 16:44:36.631053	Created Skill Rating 3 (Avg Cycle Time: 25s)
1018	SkillAssessment	2494	Created	Admin	2026-09-10 16:44:36.646623	Created Skill Rating 2 (Avg Cycle Time: 54s)
1022	SkillAssessment	2498	Created	Admin	2026-09-10 16:44:36.668779	Created Skill Rating 1 (Avg Cycle Time: 52s)
2310	CapacityPlan	3	Created	Admin	2026-09-11 12:56:45.415105	Created CapacityPlan #3
877	SkillAssessment	2353	Created	Admin	2026-09-10 16:44:35.776569	Created Skill Rating 5 (Avg Cycle Time: 21s)
879	SkillAssessment	2355	Created	Admin	2026-09-10 16:44:35.788033	Created Skill Rating 3 (Avg Cycle Time: 84s)
880	SkillAssessment	2356	Created	Admin	2026-09-10 16:44:35.794612	Created Skill Rating 4 (Avg Cycle Time: 25s)
881	SkillAssessment	2357	Created	Admin	2026-09-10 16:44:35.801161	Created Skill Rating 4 (Avg Cycle Time: 21s)
883	SkillAssessment	2359	Created	Admin	2026-09-10 16:44:35.813077	Created Skill Rating 3 (Avg Cycle Time: 24s)
884	SkillAssessment	2360	Created	Admin	2026-09-10 16:44:35.821009	Created Skill Rating 3 (Avg Cycle Time: 25s)
886	SkillAssessment	2362	Created	Admin	2026-09-10 16:44:35.832036	Created Skill Rating 3 (Avg Cycle Time: 25s)
887	SkillAssessment	2363	Created	Admin	2026-09-10 16:44:35.838515	Created Skill Rating 2 (Avg Cycle Time: 30s)
889	SkillAssessment	2365	Created	Admin	2026-09-10 16:44:35.849213	Created Skill Rating 3 (Avg Cycle Time: 25s)
890	SkillAssessment	2366	Created	Admin	2026-09-10 16:44:35.856397	Created Skill Rating 2 (Avg Cycle Time: 29s)
891	SkillAssessment	2367	Created	Admin	2026-09-10 16:44:35.862266	Created Skill Rating 3 (Avg Cycle Time: 28s)
893	SkillAssessment	2369	Created	Admin	2026-09-10 16:44:35.873978	Created Skill Rating 4 (Avg Cycle Time: 20s)
894	SkillAssessment	2370	Created	Admin	2026-09-10 16:44:35.880078	Created Skill Rating 2 (Avg Cycle Time: 63s)
896	SkillAssessment	2372	Created	Admin	2026-09-10 16:44:35.891798	Created Skill Rating 3 (Avg Cycle Time: 35s)
897	SkillAssessment	2373	Created	Admin	2026-09-10 16:44:35.896604	Created Skill Rating 3 (Avg Cycle Time: 84s)
899	SkillAssessment	2375	Created	Admin	2026-09-10 16:44:35.911111	Created Skill Rating 3 (Avg Cycle Time: 25s)
900	SkillAssessment	2376	Created	Admin	2026-09-10 16:44:35.915719	Created Skill Rating 3 (Avg Cycle Time: 25s)
901	SkillAssessment	2377	Created	Admin	2026-09-10 16:44:35.92371	Created Skill Rating 3 (Avg Cycle Time: 25s)
903	SkillAssessment	2379	Created	Admin	2026-09-10 16:44:35.931757	Created Skill Rating 3 (Avg Cycle Time: 25s)
904	SkillAssessment	2380	Created	Admin	2026-09-10 16:44:35.940044	Created Skill Rating 3 (Avg Cycle Time: 24s)
906	SkillAssessment	2382	Created	Admin	2026-09-10 16:44:35.948918	Created Skill Rating 3 (Avg Cycle Time: 25s)
907	SkillAssessment	2383	Created	Admin	2026-09-10 16:44:35.95599	Created Skill Rating 2 (Avg Cycle Time: 30s)
909	SkillAssessment	2385	Created	Admin	2026-09-10 16:44:35.963884	Created Skill Rating 2 (Avg Cycle Time: 34s)
910	SkillAssessment	2386	Created	Admin	2026-09-10 16:44:35.970897	Created Skill Rating 1 (Avg Cycle Time: 69s)
911	SkillAssessment	2387	Created	Admin	2026-09-10 16:44:35.976433	Created Skill Rating 1 (Avg Cycle Time: 37s)
913	SkillAssessment	2389	Created	Admin	2026-09-10 16:44:35.98676	Created Skill Rating 2 (Avg Cycle Time: 34s)
914	SkillAssessment	2390	Created	Admin	2026-09-10 16:44:35.992856	Created Skill Rating 1 (Avg Cycle Time: 53s)
916	SkillAssessment	2392	Created	Admin	2026-09-10 16:44:36.004154	Created Skill Rating 1 (Avg Cycle Time: 44s)
917	SkillAssessment	2393	Created	Admin	2026-09-10 16:44:36.010169	Created Skill Rating 1 (Avg Cycle Time: 37s)
919	SkillAssessment	2395	Created	Admin	2026-09-10 16:44:36.024857	Created Skill Rating 4 (Avg Cycle Time: 21s)
920	SkillAssessment	2396	Created	Admin	2026-09-10 16:44:36.031884	Created Skill Rating 3 (Avg Cycle Time: 25s)
921	SkillAssessment	2397	Created	Admin	2026-09-10 16:44:36.043093	Created Skill Rating 4 (Avg Cycle Time: 20s)
923	SkillAssessment	2399	Created	Admin	2026-09-10 16:44:36.051856	Created Skill Rating 2 (Avg Cycle Time: 30s)
924	SkillAssessment	2400	Created	Admin	2026-09-10 16:44:36.059852	Created Skill Rating 5 (Avg Cycle Time: 17s)
926	SkillAssessment	2402	Created	Admin	2026-09-10 16:44:36.074965	Created Skill Rating 5 (Avg Cycle Time: 17s)
927	SkillAssessment	2403	Created	Admin	2026-09-10 16:44:36.086783	Created Skill Rating 3 (Avg Cycle Time: 28s)
929	SkillAssessment	2405	Created	Admin	2026-09-10 16:44:36.097916	Created Skill Rating 2 (Avg Cycle Time: 30s)
930	SkillAssessment	2406	Created	Admin	2026-09-10 16:44:36.106093	Created Skill Rating 3 (Avg Cycle Time: 52s)
931	SkillAssessment	2407	Created	Admin	2026-09-10 16:44:36.114397	Created Skill Rating 4 (Avg Cycle Time: 24s)
933	SkillAssessment	2409	Created	Admin	2026-09-10 16:44:36.131052	Created Skill Rating 3 (Avg Cycle Time: 83s)
934	SkillAssessment	2410	Created	Admin	2026-09-10 16:44:36.14277	Created Skill Rating 2 (Avg Cycle Time: 35s)
936	SkillAssessment	2412	Created	Admin	2026-09-10 16:44:36.162992	Created Skill Rating 2 (Avg Cycle Time: 30s)
937	SkillAssessment	2413	Created	Admin	2026-09-10 16:44:36.171162	Created Skill Rating 2 (Avg Cycle Time: 29s)
939	SkillAssessment	2415	Created	Admin	2026-09-10 16:44:36.184308	Created Skill Rating 3 (Avg Cycle Time: 24s)
940	SkillAssessment	2416	Created	Admin	2026-09-10 16:44:36.192911	Created Skill Rating 3 (Avg Cycle Time: 24s)
941	SkillAssessment	2417	Created	Admin	2026-09-10 16:44:36.200233	Created Skill Rating 3 (Avg Cycle Time: 24s)
943	SkillAssessment	2419	Created	Admin	2026-09-10 16:44:36.220102	Created Skill Rating 3 (Avg Cycle Time: 25s)
944	SkillAssessment	2420	Created	Admin	2026-09-10 16:44:36.225987	Created Skill Rating 3 (Avg Cycle Time: 24s)
946	SkillAssessment	2422	Created	Admin	2026-09-10 16:44:36.238618	Created Skill Rating 2 (Avg Cycle Time: 55s)
947	SkillAssessment	2423	Created	Admin	2026-09-10 16:44:36.244131	Created Skill Rating 1 (Avg Cycle Time: 37s)
949	SkillAssessment	2425	Created	Admin	2026-09-10 16:44:36.257997	Created Skill Rating 2 (Avg Cycle Time: 36s)
950	SkillAssessment	2426	Created	Admin	2026-09-10 16:44:36.263684	Created Skill Rating 1 (Avg Cycle Time: 53s)
951	SkillAssessment	2427	Created	Admin	2026-09-10 16:44:36.269231	Created Skill Rating 1 (Avg Cycle Time: 125s)
953	SkillAssessment	2429	Created	Admin	2026-09-10 16:44:36.280516	Created Skill Rating 1 (Avg Cycle Time: 36s)
954	SkillAssessment	2430	Created	Admin	2026-09-10 16:44:36.288193	Created Skill Rating 2 (Avg Cycle Time: 29s)
956	SkillAssessment	2432	Created	Admin	2026-09-10 16:44:36.298161	Created Skill Rating 3 (Avg Cycle Time: 24s)
957	SkillAssessment	2433	Created	Admin	2026-09-10 16:44:36.303896	Created Skill Rating 4 (Avg Cycle Time: 20s)
959	SkillAssessment	2435	Created	Admin	2026-09-10 16:44:36.312223	Created Skill Rating 3 (Avg Cycle Time: 24s)
960	SkillAssessment	2436	Created	Admin	2026-09-10 16:44:36.315953	Created Skill Rating 4 (Avg Cycle Time: 21s)
961	SkillAssessment	2437	Created	Admin	2026-09-10 16:44:36.321977	Created Skill Rating 5 (Avg Cycle Time: 17s)
963	SkillAssessment	2439	Created	Admin	2026-09-10 16:44:36.330292	Created Skill Rating 3 (Avg Cycle Time: 28s)
2311	LineDesign	4	Created	Admin	2026-09-11 12:57:03.283909	Created LineDesign #4
964	SkillAssessment	2440	Created	Admin	2026-09-10 16:44:36.336696	Created Skill Rating 3 (Avg Cycle Time: 46s)
966	SkillAssessment	2442	Created	Admin	2026-09-10 16:44:36.346715	Created Skill Rating 3 (Avg Cycle Time: 52s)
967	SkillAssessment	2443	Created	Admin	2026-09-10 16:44:36.353148	Created Skill Rating 2 (Avg Cycle Time: 36s)
969	SkillAssessment	2445	Created	Admin	2026-09-10 16:44:36.363238	Created Skill Rating 4 (Avg Cycle Time: 70s)
970	SkillAssessment	2446	Created	Admin	2026-09-10 16:44:36.367933	Created Skill Rating 4 (Avg Cycle Time: 24s)
971	SkillAssessment	2447	Created	Admin	2026-09-10 16:44:36.374548	Created Skill Rating 2 (Avg Cycle Time: 30s)
973	SkillAssessment	2449	Created	Admin	2026-09-10 16:44:36.383556	Created Skill Rating 2 (Avg Cycle Time: 30s)
974	SkillAssessment	2450	Created	Admin	2026-09-10 16:44:36.39814	Created Skill Rating 2 (Avg Cycle Time: 29s)
976	SkillAssessment	2452	Created	Admin	2026-09-10 16:44:36.408838	Created Skill Rating 2 (Avg Cycle Time: 30s)
977	SkillAssessment	2453	Created	Admin	2026-09-10 16:44:36.412884	Created Skill Rating 2 (Avg Cycle Time: 29s)
979	SkillAssessment	2455	Created	Admin	2026-09-10 16:44:36.423112	Created Skill Rating 2 (Avg Cycle Time: 30s)
980	SkillAssessment	2456	Created	Admin	2026-09-10 16:44:36.427921	Created Skill Rating 3 (Avg Cycle Time: 25s)
981	SkillAssessment	2457	Created	Admin	2026-09-10 16:44:36.430312	Created Skill Rating 2 (Avg Cycle Time: 33s)
983	SkillAssessment	2459	Created	Admin	2026-09-10 16:44:36.446362	Created Skill Rating 3 (Avg Cycle Time: 25s)
984	SkillAssessment	2460	Created	Admin	2026-09-10 16:44:36.451875	Created Skill Rating 3 (Avg Cycle Time: 52s)
986	SkillAssessment	2462	Created	Admin	2026-09-10 16:44:36.464461	Created Skill Rating 2 (Avg Cycle Time: 43s)
987	SkillAssessment	2463	Created	Admin	2026-09-10 16:44:36.471034	Created Skill Rating 2 (Avg Cycle Time: 100s)
989	SkillAssessment	2465	Created	Admin	2026-09-10 16:44:36.480099	Created Skill Rating 2 (Avg Cycle Time: 29s)
990	SkillAssessment	2466	Created	Admin	2026-09-10 16:44:36.488065	Created Skill Rating 5 (Avg Cycle Time: 17s)
991	SkillAssessment	2467	Created	Admin	2026-09-10 16:44:36.493074	Created Skill Rating 4 (Avg Cycle Time: 21s)
993	SkillAssessment	2469	Created	Admin	2026-09-10 16:44:36.505714	Created Skill Rating 4 (Avg Cycle Time: 20s)
994	SkillAssessment	2470	Created	Admin	2026-09-10 16:44:36.511723	Created Skill Rating 5 (Avg Cycle Time: 17s)
996	SkillAssessment	2472	Created	Admin	2026-09-10 16:44:36.522893	Created Skill Rating 3 (Avg Cycle Time: 24s)
997	SkillAssessment	2473	Created	Admin	2026-09-10 16:44:36.527787	Created Skill Rating 3 (Avg Cycle Time: 25s)
999	SkillAssessment	2475	Created	Admin	2026-09-10 16:44:36.539834	Created Skill Rating 3 (Avg Cycle Time: 28s)
1000	SkillAssessment	2476	Created	Admin	2026-09-10 16:44:36.544908	Created Skill Rating 3 (Avg Cycle Time: 46s)
1001	SkillAssessment	2477	Created	Admin	2026-09-10 16:44:36.550915	Created Skill Rating 4 (Avg Cycle Time: 21s)
1003	SkillAssessment	2479	Created	Admin	2026-09-10 16:44:36.563947	Created Skill Rating 3 (Avg Cycle Time: 28s)
1004	SkillAssessment	2480	Created	Admin	2026-09-10 16:44:36.57204	Created Skill Rating 3 (Avg Cycle Time: 36s)
1006	SkillAssessment	2482	Created	Admin	2026-09-10 16:44:36.58182	Created Skill Rating 3 (Avg Cycle Time: 29s)
1007	SkillAssessment	2483	Created	Admin	2026-09-10 16:44:36.589065	Created Skill Rating 4 (Avg Cycle Time: 21s)
1009	SkillAssessment	2485	Created	Admin	2026-09-10 16:44:36.599126	Created Skill Rating 2 (Avg Cycle Time: 30s)
1010	SkillAssessment	2486	Created	Admin	2026-09-10 16:44:36.604957	Created Skill Rating 3 (Avg Cycle Time: 24s)
1011	SkillAssessment	2487	Created	Admin	2026-09-10 16:44:36.610397	Created Skill Rating 3 (Avg Cycle Time: 24s)
1013	SkillAssessment	2489	Created	Admin	2026-09-10 16:44:36.620386	Created Skill Rating 2 (Avg Cycle Time: 29s)
1014	SkillAssessment	2490	Created	Admin	2026-09-10 16:44:36.625834	Created Skill Rating 3 (Avg Cycle Time: 24s)
1016	SkillAssessment	2492	Created	Admin	2026-09-10 16:44:36.63481	Created Skill Rating 2 (Avg Cycle Time: 29s)
1017	SkillAssessment	2493	Created	Admin	2026-09-10 16:44:36.641923	Created Skill Rating 2 (Avg Cycle Time: 34s)
1019	SkillAssessment	2495	Created	Admin	2026-09-10 16:44:36.651854	Created Skill Rating 2 (Avg Cycle Time: 30s)
1020	SkillAssessment	2496	Created	Admin	2026-09-10 16:44:36.65924	Created Skill Rating 2 (Avg Cycle Time: 62s)
1021	SkillAssessment	2497	Created	Admin	2026-09-10 16:44:36.66376	Created Skill Rating 2 (Avg Cycle Time: 35s)
1023	SkillAssessment	2499	Created	Admin	2026-09-10 16:44:36.675319	Created Skill Rating 1 (Avg Cycle Time: 127s)
1024	SkillAssessment	2500	Created	Admin	2026-09-10 16:44:36.679873	Created Skill Rating 1 (Avg Cycle Time: 43s)
1026	SkillAssessment	2502	Created	Admin	2026-09-10 16:44:36.693852	Created Skill Rating 3 (Avg Cycle Time: 25s)
1027	SkillAssessment	2503	Created	Admin	2026-09-10 16:44:36.699348	Created Skill Rating 4 (Avg Cycle Time: 20s)
1029	SkillAssessment	2505	Created	Admin	2026-09-10 16:44:36.711959	Created Skill Rating 5 (Avg Cycle Time: 17s)
1030	SkillAssessment	2506	Created	Admin	2026-09-10 16:44:36.715699	Created Skill Rating 3 (Avg Cycle Time: 24s)
1031	SkillAssessment	2507	Created	Admin	2026-09-10 16:44:36.721887	Created Skill Rating 2 (Avg Cycle Time: 29s)
1033	SkillAssessment	2509	Created	Admin	2026-09-10 16:44:36.732214	Created Skill Rating 5 (Avg Cycle Time: 17s)
1034	SkillAssessment	2510	Created	Admin	2026-09-10 16:44:36.740326	Created Skill Rating 4 (Avg Cycle Time: 20s)
1036	SkillAssessment	2512	Created	Admin	2026-09-10 16:44:36.748964	Created Skill Rating 3 (Avg Cycle Time: 45s)
1037	SkillAssessment	2513	Created	Admin	2026-09-10 16:44:36.756089	Created Skill Rating 4 (Avg Cycle Time: 21s)
1039	SkillAssessment	2515	Created	Admin	2026-09-10 16:44:36.766776	Created Skill Rating 5 (Avg Cycle Time: 20s)
1040	SkillAssessment	2516	Created	Admin	2026-09-10 16:44:36.774301	Created Skill Rating 4 (Avg Cycle Time: 29s)
1041	SkillAssessment	2517	Created	Admin	2026-09-10 16:44:36.779877	Created Skill Rating 3 (Avg Cycle Time: 83s)
1043	SkillAssessment	2519	Created	Admin	2026-09-10 16:44:36.791673	Created Skill Rating 4 (Avg Cycle Time: 21s)
1044	SkillAssessment	2520	Created	Admin	2026-09-10 16:44:36.796401	Created Skill Rating 2 (Avg Cycle Time: 30s)
1046	SkillAssessment	2522	Created	Admin	2026-09-10 16:44:36.807917	Created Skill Rating 3 (Avg Cycle Time: 25s)
1047	SkillAssessment	2523	Created	Admin	2026-09-10 16:44:36.812011	Created Skill Rating 3 (Avg Cycle Time: 24s)
1049	SkillAssessment	2525	Created	Admin	2026-09-10 16:44:36.822029	Created Skill Rating 3 (Avg Cycle Time: 24s)
1050	SkillAssessment	2526	Created	Admin	2026-09-10 16:44:36.8266	Created Skill Rating 3 (Avg Cycle Time: 25s)
2335	Notification	7	Updated	Admin	2026-09-12 10:20:33.085481	Updated Notification #7
1025	SkillAssessment	2501	Created	Admin	2026-09-10 16:44:36.685325	Created Skill Rating 2 (Avg Cycle Time: 29s)
1028	SkillAssessment	2504	Created	Admin	2026-09-10 16:44:36.705297	Created Skill Rating 2 (Avg Cycle Time: 30s)
1032	SkillAssessment	2508	Created	Admin	2026-09-10 16:44:36.727221	Created Skill Rating 5 (Avg Cycle Time: 17s)
1035	SkillAssessment	2511	Created	Admin	2026-09-10 16:44:36.744435	Created Skill Rating 3 (Avg Cycle Time: 28s)
1038	SkillAssessment	2514	Created	Admin	2026-09-10 16:44:36.760664	Created Skill Rating 4 (Avg Cycle Time: 44s)
1042	SkillAssessment	2518	Created	Admin	2026-09-10 16:44:36.784438	Created Skill Rating 4 (Avg Cycle Time: 25s)
1045	SkillAssessment	2521	Created	Admin	2026-09-10 16:44:36.801024	Created Skill Rating 3 (Avg Cycle Time: 25s)
1048	SkillAssessment	2524	Created	Admin	2026-09-10 16:44:36.816673	Created Skill Rating 2 (Avg Cycle Time: 29s)
1052	SkillAssessment	2528	Created	Admin	2026-09-10 16:44:36.839437	Created Skill Rating 2 (Avg Cycle Time: 30s)
1055	SkillAssessment	2531	Created	Admin	2026-09-10 16:44:36.856767	Created Skill Rating 1 (Avg Cycle Time: 37s)
1058	SkillAssessment	2534	Created	Admin	2026-09-10 16:44:36.87496	Created Skill Rating 1 (Avg Cycle Time: 52s)
1062	SkillAssessment	2538	Created	Admin	2026-09-10 16:44:36.89738	Created Skill Rating 2 (Avg Cycle Time: 30s)
1065	SkillAssessment	2541	Created	Admin	2026-09-10 16:44:36.916613	Created Skill Rating 5 (Avg Cycle Time: 17s)
1068	SkillAssessment	2544	Created	Admin	2026-09-10 16:44:36.936946	Created Skill Rating 4 (Avg Cycle Time: 21s)
1072	SkillAssessment	2548	Created	Admin	2026-09-10 16:44:36.963945	Created Skill Rating 5 (Avg Cycle Time: 32s)
1075	SkillAssessment	2551	Created	Admin	2026-09-10 16:44:36.98381	Created Skill Rating 5 (Avg Cycle Time: 21s)
1078	SkillAssessment	2554	Created	Admin	2026-09-10 16:44:37.007285	Created Skill Rating 5 (Avg Cycle Time: 21s)
1082	SkillAssessment	2558	Created	Admin	2026-09-10 16:44:37.030949	Created Skill Rating 5 (Avg Cycle Time: 17s)
1085	SkillAssessment	2561	Created	Admin	2026-09-10 16:44:37.051022	Created Skill Rating 5 (Avg Cycle Time: 17s)
1088	SkillAssessment	2564	Created	Admin	2026-09-10 16:44:37.068059	Created Skill Rating 4 (Avg Cycle Time: 21s)
1092	SkillAssessment	2568	Created	Admin	2026-09-10 16:44:37.092082	Created Skill Rating 2 (Avg Cycle Time: 64s)
1095	SkillAssessment	2571	Created	Admin	2026-09-10 16:44:37.109196	Created Skill Rating 2 (Avg Cycle Time: 102s)
1098	SkillAssessment	2574	Created	Admin	2026-09-10 16:44:37.126313	Created Skill Rating 5 (Avg Cycle Time: 17s)
1102	SkillAssessment	2578	Created	Admin	2026-09-10 16:44:37.149992	Created Skill Rating 5 (Avg Cycle Time: 17s)
1105	SkillAssessment	2581	Created	Admin	2026-09-10 16:44:37.169794	Created Skill Rating 4 (Avg Cycle Time: 21s)
1108	SkillAssessment	2584	Created	Admin	2026-09-10 16:44:37.188569	Created Skill Rating 3 (Avg Cycle Time: 46s)
1112	SkillAssessment	2588	Created	Admin	2026-09-10 16:44:37.22372	Created Skill Rating 4 (Avg Cycle Time: 29s)
1115	SkillAssessment	2591	Created	Admin	2026-09-10 16:44:37.250274	Created Skill Rating 5 (Avg Cycle Time: 18s)
1118	SkillAssessment	2594	Created	Admin	2026-09-10 16:44:37.276108	Created Skill Rating 2 (Avg Cycle Time: 30s)
1122	SkillAssessment	2598	Created	Admin	2026-09-10 16:44:37.296436	Created Skill Rating 3 (Avg Cycle Time: 24s)
1125	SkillAssessment	2601	Created	Admin	2026-09-10 16:44:37.3105	Created Skill Rating 2 (Avg Cycle Time: 34s)
1128	SkillAssessment	2604	Created	Admin	2026-09-10 16:44:37.326661	Created Skill Rating 1 (Avg Cycle Time: 79s)
1132	SkillAssessment	2608	Created	Admin	2026-09-10 16:44:37.345758	Created Skill Rating 1 (Avg Cycle Time: 44s)
1135	SkillAssessment	2611	Created	Admin	2026-09-10 16:44:37.362023	Created Skill Rating 5 (Avg Cycle Time: 17s)
1138	SkillAssessment	2614	Created	Admin	2026-09-10 16:44:37.375963	Created Skill Rating 2 (Avg Cycle Time: 29s)
1142	SkillAssessment	2618	Created	Admin	2026-09-10 16:44:37.396684	Created Skill Rating 4 (Avg Cycle Time: 20s)
1145	SkillAssessment	2621	Created	Admin	2026-09-10 16:44:37.41311	Created Skill Rating 4 (Avg Cycle Time: 20s)
1148	SkillAssessment	2624	Created	Admin	2026-09-10 16:44:37.430012	Created Skill Rating 4 (Avg Cycle Time: 30s)
1152	SkillAssessment	2628	Created	Admin	2026-09-10 16:44:37.450226	Created Skill Rating 3 (Avg Cycle Time: 24s)
1155	SkillAssessment	2631	Created	Admin	2026-09-10 16:44:37.464372	Created Skill Rating 2 (Avg Cycle Time: 30s)
1158	SkillAssessment	2634	Created	Admin	2026-09-10 16:44:37.480152	Created Skill Rating 3 (Avg Cycle Time: 24s)
1162	SkillAssessment	2638	Created	Admin	2026-09-10 16:44:37.500391	Created Skill Rating 1 (Avg Cycle Time: 68s)
1165	SkillAssessment	2641	Created	Admin	2026-09-10 16:44:37.516549	Created Skill Rating 1 (Avg Cycle Time: 43s)
1168	SkillAssessment	2644	Created	Admin	2026-09-10 16:44:37.53191	Created Skill Rating 1 (Avg Cycle Time: 43s)
1172	SkillAssessment	2648	Created	Admin	2026-09-10 16:44:37.550311	Created Skill Rating 3 (Avg Cycle Time: 25s)
1175	SkillAssessment	2651	Created	Admin	2026-09-10 16:44:37.565832	Created Skill Rating 3 (Avg Cycle Time: 24s)
1178	SkillAssessment	2654	Created	Admin	2026-09-10 16:44:37.582047	Created Skill Rating 5 (Avg Cycle Time: 17s)
1182	SkillAssessment	2658	Created	Admin	2026-09-10 16:44:37.600666	Created Skill Rating 4 (Avg Cycle Time: 45s)
1185	SkillAssessment	2661	Created	Admin	2026-09-10 16:44:37.615766	Created Skill Rating 4 (Avg Cycle Time: 70s)
1188	SkillAssessment	2664	Created	Admin	2026-09-10 16:44:37.629554	Created Skill Rating 3 (Avg Cycle Time: 24s)
1192	SkillAssessment	2668	Created	Admin	2026-09-10 16:44:37.646649	Created Skill Rating 3 (Avg Cycle Time: 25s)
1195	SkillAssessment	2671	Created	Admin	2026-09-10 16:44:37.660503	Created Skill Rating 3 (Avg Cycle Time: 25s)
1198	SkillAssessment	2674	Created	Admin	2026-09-10 16:44:37.673816	Created Skill Rating 3 (Avg Cycle Time: 45s)
1202	SkillAssessment	2678	Created	Admin	2026-09-10 16:44:37.691948	Created Skill Rating 3 (Avg Cycle Time: 34s)
1205	SkillAssessment	2681	Created	Admin	2026-09-10 16:44:37.704759	Created Skill Rating 3 (Avg Cycle Time: 25s)
1208	SkillAssessment	2684	Created	Admin	2026-09-10 16:44:37.71655	Created Skill Rating 4 (Avg Cycle Time: 21s)
1212	SkillAssessment	2688	Created	Admin	2026-09-10 16:44:37.736932	Created Skill Rating 4 (Avg Cycle Time: 21s)
1215	SkillAssessment	2691	Created	Admin	2026-09-10 16:44:37.750472	Created Skill Rating 4 (Avg Cycle Time: 23s)
1218	SkillAssessment	2694	Created	Admin	2026-09-10 16:44:37.766988	Created Skill Rating 4 (Avg Cycle Time: 44s)
1222	SkillAssessment	2698	Created	Admin	2026-09-10 16:44:37.786601	Created Skill Rating 4 (Avg Cycle Time: 24s)
1225	SkillAssessment	2701	Created	Admin	2026-09-10 16:44:37.800232	Created Skill Rating 2 (Avg Cycle Time: 29s)
2336	Notification	7	Updated	Admin	2026-09-12 10:20:33.18972	Updated Notification #7
1051	SkillAssessment	2527	Created	Admin	2026-09-10 16:44:36.83073	Created Skill Rating 2 (Avg Cycle Time: 30s)
1053	SkillAssessment	2529	Created	Admin	2026-09-10 16:44:36.844729	Created Skill Rating 1 (Avg Cycle Time: 41s)
1054	SkillAssessment	2530	Created	Admin	2026-09-10 16:44:36.849823	Created Skill Rating 1 (Avg Cycle Time: 68s)
1056	SkillAssessment	2532	Created	Admin	2026-09-10 16:44:36.862995	Created Skill Rating 1 (Avg Cycle Time: 79s)
1057	SkillAssessment	2533	Created	Admin	2026-09-10 16:44:36.866698	Created Skill Rating 1 (Avg Cycle Time: 44s)
1059	SkillAssessment	2535	Created	Admin	2026-09-10 16:44:36.879959	Created Skill Rating 2 (Avg Cycle Time: 100s)
1060	SkillAssessment	2536	Created	Admin	2026-09-10 16:44:36.884485	Created Skill Rating 1 (Avg Cycle Time: 44s)
1061	SkillAssessment	2537	Created	Admin	2026-09-10 16:44:36.89277	Created Skill Rating 1 (Avg Cycle Time: 37s)
1063	SkillAssessment	2539	Created	Admin	2026-09-10 16:44:36.904022	Created Skill Rating 4 (Avg Cycle Time: 20s)
1064	SkillAssessment	2540	Created	Admin	2026-09-10 16:44:36.910172	Created Skill Rating 3 (Avg Cycle Time: 25s)
1066	SkillAssessment	2542	Created	Admin	2026-09-10 16:44:36.924944	Created Skill Rating 2 (Avg Cycle Time: 29s)
1067	SkillAssessment	2543	Created	Admin	2026-09-10 16:44:36.929375	Created Skill Rating 2 (Avg Cycle Time: 29s)
1069	SkillAssessment	2545	Created	Admin	2026-09-10 16:44:36.944037	Created Skill Rating 5 (Avg Cycle Time: 17s)
1070	SkillAssessment	2546	Created	Admin	2026-09-10 16:44:36.948355	Created Skill Rating 4 (Avg Cycle Time: 21s)
1071	SkillAssessment	2547	Created	Admin	2026-09-10 16:44:36.956387	Created Skill Rating 5 (Avg Cycle Time: 20s)
1073	SkillAssessment	2549	Created	Admin	2026-09-10 16:44:36.967981	Created Skill Rating 5 (Avg Cycle Time: 17s)
1074	SkillAssessment	2550	Created	Admin	2026-09-10 16:44:36.976929	Created Skill Rating 5 (Avg Cycle Time: 36s)
1076	SkillAssessment	2552	Created	Admin	2026-09-10 16:44:36.992618	Created Skill Rating 5 (Avg Cycle Time: 24s)
1077	SkillAssessment	2553	Created	Admin	2026-09-10 16:44:36.998236	Created Skill Rating 5 (Avg Cycle Time: 58s)
1079	SkillAssessment	2555	Created	Admin	2026-09-10 16:44:37.01193	Created Skill Rating 5 (Avg Cycle Time: 18s)
1080	SkillAssessment	2556	Created	Admin	2026-09-10 16:44:37.016581	Created Skill Rating 5 (Avg Cycle Time: 17s)
1081	SkillAssessment	2557	Created	Admin	2026-09-10 16:44:37.025842	Created Skill Rating 4 (Avg Cycle Time: 20s)
1083	SkillAssessment	2559	Created	Admin	2026-09-10 16:44:37.03799	Created Skill Rating 4 (Avg Cycle Time: 20s)
1084	SkillAssessment	2560	Created	Admin	2026-09-10 16:44:37.046019	Created Skill Rating 5 (Avg Cycle Time: 18s)
1086	SkillAssessment	2562	Created	Admin	2026-09-10 16:44:37.057915	Created Skill Rating 4 (Avg Cycle Time: 21s)
1087	SkillAssessment	2563	Created	Admin	2026-09-10 16:44:37.06295	Created Skill Rating 4 (Avg Cycle Time: 20s)
1089	SkillAssessment	2565	Created	Admin	2026-09-10 16:44:37.073989	Created Skill Rating 2 (Avg Cycle Time: 34s)
1090	SkillAssessment	2566	Created	Admin	2026-09-10 16:44:37.080002	Created Skill Rating 2 (Avg Cycle Time: 54s)
1091	SkillAssessment	2567	Created	Admin	2026-09-10 16:44:37.084533	Created Skill Rating 2 (Avg Cycle Time: 29s)
1093	SkillAssessment	2569	Created	Admin	2026-09-10 16:44:37.097117	Created Skill Rating 2 (Avg Cycle Time: 34s)
1094	SkillAssessment	2570	Created	Admin	2026-09-10 16:44:37.10315	Created Skill Rating 2 (Avg Cycle Time: 41s)
1096	SkillAssessment	2572	Created	Admin	2026-09-10 16:44:37.113716	Created Skill Rating 3 (Avg Cycle Time: 29s)
1097	SkillAssessment	2573	Created	Admin	2026-09-10 16:44:37.118247	Created Skill Rating 3 (Avg Cycle Time: 24s)
1099	SkillAssessment	2575	Created	Admin	2026-09-10 16:44:37.131836	Created Skill Rating 4 (Avg Cycle Time: 21s)
1100	SkillAssessment	2576	Created	Admin	2026-09-10 16:44:37.138927	Created Skill Rating 5 (Avg Cycle Time: 18s)
1101	SkillAssessment	2577	Created	Admin	2026-09-10 16:44:37.144448	Created Skill Rating 4 (Avg Cycle Time: 21s)
1103	SkillAssessment	2579	Created	Admin	2026-09-10 16:44:37.160081	Created Skill Rating 5 (Avg Cycle Time: 18s)
1104	SkillAssessment	2580	Created	Admin	2026-09-10 16:44:37.164139	Created Skill Rating 3 (Avg Cycle Time: 24s)
1106	SkillAssessment	2582	Created	Admin	2026-09-10 16:44:37.176386	Created Skill Rating 3 (Avg Cycle Time: 25s)
1107	SkillAssessment	2583	Created	Admin	2026-09-10 16:44:37.182321	Created Skill Rating 4 (Avg Cycle Time: 24s)
1109	SkillAssessment	2585	Created	Admin	2026-09-10 16:44:37.194549	Created Skill Rating 5 (Avg Cycle Time: 17s)
1110	SkillAssessment	2586	Created	Admin	2026-09-10 16:44:37.208141	Created Skill Rating 3 (Avg Cycle Time: 52s)
1111	SkillAssessment	2587	Created	Admin	2026-09-10 16:44:37.214667	Created Skill Rating 3 (Avg Cycle Time: 29s)
1113	SkillAssessment	2589	Created	Admin	2026-09-10 16:44:37.230751	Created Skill Rating 4 (Avg Cycle Time: 71s)
1114	SkillAssessment	2590	Created	Admin	2026-09-10 16:44:37.241353	Created Skill Rating 4 (Avg Cycle Time: 24s)
1116	SkillAssessment	2592	Created	Admin	2026-09-10 16:44:37.262223	Created Skill Rating 2 (Avg Cycle Time: 30s)
1117	SkillAssessment	2593	Created	Admin	2026-09-10 16:44:37.270696	Created Skill Rating 2 (Avg Cycle Time: 29s)
1119	SkillAssessment	2595	Created	Admin	2026-09-10 16:44:37.281113	Created Skill Rating 3 (Avg Cycle Time: 24s)
1120	SkillAssessment	2596	Created	Admin	2026-09-10 16:44:37.285786	Created Skill Rating 3 (Avg Cycle Time: 25s)
1121	SkillAssessment	2597	Created	Admin	2026-09-10 16:44:37.291827	Created Skill Rating 2 (Avg Cycle Time: 30s)
1123	SkillAssessment	2599	Created	Admin	2026-09-10 16:44:37.301087	Created Skill Rating 3 (Avg Cycle Time: 25s)
1124	SkillAssessment	2600	Created	Admin	2026-09-10 16:44:37.306785	Created Skill Rating 3 (Avg Cycle Time: 24s)
1126	SkillAssessment	2602	Created	Admin	2026-09-10 16:44:37.316906	Created Skill Rating 2 (Avg Cycle Time: 55s)
1127	SkillAssessment	2603	Created	Admin	2026-09-10 16:44:37.322956	Created Skill Rating 2 (Avg Cycle Time: 29s)
1129	SkillAssessment	2605	Created	Admin	2026-09-10 16:44:37.330389	Created Skill Rating 1 (Avg Cycle Time: 44s)
1130	SkillAssessment	2606	Created	Admin	2026-09-10 16:44:37.335672	Created Skill Rating 2 (Avg Cycle Time: 41s)
1131	SkillAssessment	2607	Created	Admin	2026-09-10 16:44:37.341943	Created Skill Rating 1 (Avg Cycle Time: 127s)
1133	SkillAssessment	2609	Created	Admin	2026-09-10 16:44:37.350449	Created Skill Rating 1 (Avg Cycle Time: 37s)
1134	SkillAssessment	2610	Created	Admin	2026-09-10 16:44:37.356734	Created Skill Rating 3 (Avg Cycle Time: 24s)
1136	SkillAssessment	2612	Created	Admin	2026-09-10 16:44:37.365686	Created Skill Rating 3 (Avg Cycle Time: 24s)
1137	SkillAssessment	2613	Created	Admin	2026-09-10 16:44:37.372261	Created Skill Rating 5 (Avg Cycle Time: 17s)
2341	LinePlan	6	Created	Admin	2026-09-12 11:44:06.71258	Created LinePlan #6
1139	SkillAssessment	2615	Created	Admin	2026-09-10 16:44:37.380959	Created Skill Rating 2 (Avg Cycle Time: 30s)
1140	SkillAssessment	2616	Created	Admin	2026-09-10 16:44:37.385343	Created Skill Rating 5 (Avg Cycle Time: 18s)
1141	SkillAssessment	2617	Created	Admin	2026-09-10 16:44:37.392058	Created Skill Rating 5 (Avg Cycle Time: 18s)
1143	SkillAssessment	2619	Created	Admin	2026-09-10 16:44:37.401921	Created Skill Rating 4 (Avg Cycle Time: 23s)
1144	SkillAssessment	2620	Created	Admin	2026-09-10 16:44:37.408317	Created Skill Rating 5 (Avg Cycle Time: 32s)
1146	SkillAssessment	2622	Created	Admin	2026-09-10 16:44:37.418348	Created Skill Rating 5 (Avg Cycle Time: 37s)
1147	SkillAssessment	2623	Created	Admin	2026-09-10 16:44:37.425097	Created Skill Rating 5 (Avg Cycle Time: 20s)
1149	SkillAssessment	2625	Created	Admin	2026-09-10 16:44:37.434481	Created Skill Rating 4 (Avg Cycle Time: 71s)
1150	SkillAssessment	2626	Created	Admin	2026-09-10 16:44:37.441935	Created Skill Rating 4 (Avg Cycle Time: 24s)
1151	SkillAssessment	2627	Created	Admin	2026-09-10 16:44:37.446613	Created Skill Rating 4 (Avg Cycle Time: 20s)
1153	SkillAssessment	2629	Created	Admin	2026-09-10 16:44:37.456396	Created Skill Rating 2 (Avg Cycle Time: 30s)
1154	SkillAssessment	2630	Created	Admin	2026-09-10 16:44:37.460809	Created Skill Rating 3 (Avg Cycle Time: 25s)
1156	SkillAssessment	2632	Created	Admin	2026-09-10 16:44:37.47031	Created Skill Rating 3 (Avg Cycle Time: 24s)
1157	SkillAssessment	2633	Created	Admin	2026-09-10 16:44:37.476073	Created Skill Rating 2 (Avg Cycle Time: 29s)
1159	SkillAssessment	2635	Created	Admin	2026-09-10 16:44:37.48316	Created Skill Rating 2 (Avg Cycle Time: 29s)
1160	SkillAssessment	2636	Created	Admin	2026-09-10 16:44:37.490469	Created Skill Rating 2 (Avg Cycle Time: 30s)
1161	SkillAssessment	2637	Created	Admin	2026-09-10 16:44:37.49533	Created Skill Rating 1 (Avg Cycle Time: 43s)
1163	SkillAssessment	2639	Created	Admin	2026-09-10 16:44:37.506635	Created Skill Rating 1 (Avg Cycle Time: 37s)
1164	SkillAssessment	2640	Created	Admin	2026-09-10 16:44:37.510331	Created Skill Rating 1 (Avg Cycle Time: 79s)
1166	SkillAssessment	2642	Created	Admin	2026-09-10 16:44:37.523137	Created Skill Rating 1 (Avg Cycle Time: 53s)
1167	SkillAssessment	2643	Created	Admin	2026-09-10 16:44:37.526908	Created Skill Rating 1 (Avg Cycle Time: 126s)
1169	SkillAssessment	2645	Created	Admin	2026-09-10 16:44:37.536955	Created Skill Rating 1 (Avg Cycle Time: 37s)
1170	SkillAssessment	2646	Created	Admin	2026-09-10 16:44:37.543003	Created Skill Rating 3 (Avg Cycle Time: 25s)
1171	SkillAssessment	2647	Created	Admin	2026-09-10 16:44:37.546647	Created Skill Rating 4 (Avg Cycle Time: 20s)
1173	SkillAssessment	2649	Created	Admin	2026-09-10 16:44:37.558007	Created Skill Rating 5 (Avg Cycle Time: 17s)
1174	SkillAssessment	2650	Created	Admin	2026-09-10 16:44:37.562195	Created Skill Rating 3 (Avg Cycle Time: 24s)
1176	SkillAssessment	2652	Created	Admin	2026-09-10 16:44:37.571831	Created Skill Rating 5 (Avg Cycle Time: 17s)
1177	SkillAssessment	2653	Created	Admin	2026-09-10 16:44:37.577223	Created Skill Rating 5 (Avg Cycle Time: 17s)
1179	SkillAssessment	2655	Created	Admin	2026-09-10 16:44:37.586624	Created Skill Rating 3 (Avg Cycle Time: 29s)
1180	SkillAssessment	2656	Created	Admin	2026-09-10 16:44:37.592165	Created Skill Rating 4 (Avg Cycle Time: 38s)
1181	SkillAssessment	2657	Created	Admin	2026-09-10 16:44:37.596277	Created Skill Rating 4 (Avg Cycle Time: 21s)
1183	SkillAssessment	2659	Created	Admin	2026-09-10 16:44:37.606694	Created Skill Rating 3 (Avg Cycle Time: 29s)
1184	SkillAssessment	2660	Created	Admin	2026-09-10 16:44:37.611246	Created Skill Rating 4 (Avg Cycle Time: 30s)
1186	SkillAssessment	2662	Created	Admin	2026-09-10 16:44:37.621806	Created Skill Rating 4 (Avg Cycle Time: 24s)
1187	SkillAssessment	2663	Created	Admin	2026-09-10 16:44:37.626422	Created Skill Rating 4 (Avg Cycle Time: 21s)
1189	SkillAssessment	2665	Created	Admin	2026-09-10 16:44:37.63332	Created Skill Rating 3 (Avg Cycle Time: 24s)
1190	SkillAssessment	2666	Created	Admin	2026-09-10 16:44:37.639075	Created Skill Rating 2 (Avg Cycle Time: 30s)
1191	SkillAssessment	2667	Created	Admin	2026-09-10 16:44:37.643056	Created Skill Rating 3 (Avg Cycle Time: 24s)
1193	SkillAssessment	2669	Created	Admin	2026-09-10 16:44:37.650363	Created Skill Rating 3 (Avg Cycle Time: 24s)
1194	SkillAssessment	2670	Created	Admin	2026-09-10 16:44:37.656731	Created Skill Rating 3 (Avg Cycle Time: 24s)
1196	SkillAssessment	2672	Created	Admin	2026-09-10 16:44:37.664295	Created Skill Rating 3 (Avg Cycle Time: 25s)
1197	SkillAssessment	2673	Created	Admin	2026-09-10 16:44:37.66811	Created Skill Rating 2 (Avg Cycle Time: 33s)
1199	SkillAssessment	2675	Created	Admin	2026-09-10 16:44:37.677915	Created Skill Rating 3 (Avg Cycle Time: 25s)
1200	SkillAssessment	2676	Created	Admin	2026-09-10 16:44:37.681918	Created Skill Rating 3 (Avg Cycle Time: 52s)
1201	SkillAssessment	2677	Created	Admin	2026-09-10 16:44:37.686629	Created Skill Rating 2 (Avg Cycle Time: 35s)
1203	SkillAssessment	2679	Created	Admin	2026-09-10 16:44:37.694653	Created Skill Rating 2 (Avg Cycle Time: 102s)
1204	SkillAssessment	2680	Created	Admin	2026-09-10 16:44:37.699457	Created Skill Rating 3 (Avg Cycle Time: 29s)
1206	SkillAssessment	2682	Created	Admin	2026-09-10 16:44:37.708859	Created Skill Rating 5 (Avg Cycle Time: 17s)
1207	SkillAssessment	2683	Created	Admin	2026-09-10 16:44:37.71285	Created Skill Rating 3 (Avg Cycle Time: 24s)
1209	SkillAssessment	2685	Created	Admin	2026-09-10 16:44:37.723977	Created Skill Rating 4 (Avg Cycle Time: 20s)
1210	SkillAssessment	2686	Created	Admin	2026-09-10 16:44:37.726684	Created Skill Rating 5 (Avg Cycle Time: 18s)
1211	SkillAssessment	2687	Created	Admin	2026-09-10 16:44:37.731985	Created Skill Rating 5 (Avg Cycle Time: 18s)
1213	SkillAssessment	2689	Created	Admin	2026-09-10 16:44:37.741929	Created Skill Rating 4 (Avg Cycle Time: 21s)
1214	SkillAssessment	2690	Created	Admin	2026-09-10 16:44:37.745751	Created Skill Rating 3 (Avg Cycle Time: 25s)
1216	SkillAssessment	2692	Created	Admin	2026-09-10 16:44:37.757966	Created Skill Rating 3 (Avg Cycle Time: 46s)
1217	SkillAssessment	2693	Created	Admin	2026-09-10 16:44:37.763881	Created Skill Rating 5 (Avg Cycle Time: 18s)
1219	SkillAssessment	2695	Created	Admin	2026-09-10 16:44:37.773919	Created Skill Rating 3 (Avg Cycle Time: 29s)
1220	SkillAssessment	2696	Created	Admin	2026-09-10 16:44:37.777941	Created Skill Rating 3 (Avg Cycle Time: 34s)
1221	SkillAssessment	2697	Created	Admin	2026-09-10 16:44:37.782022	Created Skill Rating 4 (Avg Cycle Time: 71s)
1223	SkillAssessment	2699	Created	Admin	2026-09-10 16:44:37.791905	Created Skill Rating 5 (Avg Cycle Time: 18s)
1224	SkillAssessment	2700	Created	Admin	2026-09-10 16:44:37.795667	Created Skill Rating 3 (Avg Cycle Time: 24s)
2351	CapacityPlan	4	Created	Admin	2026-09-12 12:33:22.858658	Created CapacityPlan #4
1226	SkillAssessment	2702	Created	Admin	2026-09-10 16:44:37.805787	Created Skill Rating 2 (Avg Cycle Time: 29s)
1227	SkillAssessment	2703	Created	Admin	2026-09-10 16:44:37.810296	Created Skill Rating 2 (Avg Cycle Time: 29s)
1229	SkillAssessment	2705	Created	Admin	2026-09-10 16:44:37.818262	Created Skill Rating 3 (Avg Cycle Time: 24s)
1230	SkillAssessment	2706	Created	Admin	2026-09-10 16:44:37.824552	Created Skill Rating 3 (Avg Cycle Time: 25s)
1231	SkillAssessment	2707	Created	Admin	2026-09-10 16:44:37.828239	Created Skill Rating 3 (Avg Cycle Time: 25s)
1233	SkillAssessment	2709	Created	Admin	2026-09-10 16:44:37.836867	Created Skill Rating 2 (Avg Cycle Time: 33s)
1234	SkillAssessment	2710	Created	Admin	2026-09-10 16:44:37.842874	Created Skill Rating 1 (Avg Cycle Time: 69s)
1236	SkillAssessment	2712	Created	Admin	2026-09-10 16:44:37.849196	Created Skill Rating 2 (Avg Cycle Time: 63s)
1237	SkillAssessment	2713	Created	Admin	2026-09-10 16:44:37.854816	Created Skill Rating 1 (Avg Cycle Time: 43s)
1239	SkillAssessment	2715	Created	Admin	2026-09-10 16:44:37.863161	Created Skill Rating 1 (Avg Cycle Time: 125s)
1240	SkillAssessment	2716	Created	Admin	2026-09-10 16:44:37.866788	Created Skill Rating 2 (Avg Cycle Time: 35s)
1241	SkillAssessment	2717	Created	Admin	2026-09-10 16:44:37.872336	Created Skill Rating 1 (Avg Cycle Time: 37s)
1243	SkillAssessment	2719	Created	Admin	2026-09-10 16:44:37.882025	Created Skill Rating 5 (Avg Cycle Time: 18s)
1244	SkillAssessment	2720	Created	Admin	2026-09-10 16:44:37.886041	Created Skill Rating 3 (Avg Cycle Time: 24s)
1246	SkillAssessment	2722	Created	Admin	2026-09-10 16:44:37.895787	Created Skill Rating 3 (Avg Cycle Time: 24s)
1247	SkillAssessment	2723	Created	Admin	2026-09-10 16:44:37.898805	Created Skill Rating 2 (Avg Cycle Time: 29s)
1249	SkillAssessment	2725	Created	Admin	2026-09-10 16:44:37.908978	Created Skill Rating 5 (Avg Cycle Time: 18s)
1250	SkillAssessment	2726	Created	Admin	2026-09-10 16:44:37.914057	Created Skill Rating 5 (Avg Cycle Time: 17s)
1251	SkillAssessment	2727	Created	Admin	2026-09-10 16:44:37.919424	Created Skill Rating 3 (Avg Cycle Time: 28s)
1253	SkillAssessment	2729	Created	Admin	2026-09-10 16:44:37.928844	Created Skill Rating 3 (Avg Cycle Time: 24s)
1254	SkillAssessment	2730	Created	Admin	2026-09-10 16:44:37.932852	Created Skill Rating 4 (Avg Cycle Time: 45s)
1256	SkillAssessment	2732	Created	Admin	2026-09-10 16:44:37.944914	Created Skill Rating 3 (Avg Cycle Time: 35s)
1257	SkillAssessment	2733	Created	Admin	2026-09-10 16:44:37.948921	Created Skill Rating 3 (Avg Cycle Time: 84s)
1259	SkillAssessment	2735	Created	Admin	2026-09-10 16:44:37.960414	Created Skill Rating 3 (Avg Cycle Time: 24s)
1260	SkillAssessment	2736	Created	Admin	2026-09-10 16:44:37.965661	Created Skill Rating 2 (Avg Cycle Time: 29s)
1261	SkillAssessment	2737	Created	Admin	2026-09-10 16:44:37.970312	Created Skill Rating 2 (Avg Cycle Time: 29s)
1263	SkillAssessment	2739	Created	Admin	2026-09-10 16:44:37.980367	Created Skill Rating 2 (Avg Cycle Time: 30s)
1264	SkillAssessment	2740	Created	Admin	2026-09-10 16:44:37.985687	Created Skill Rating 3 (Avg Cycle Time: 25s)
1266	SkillAssessment	2742	Created	Admin	2026-09-10 16:44:37.998867	Created Skill Rating 2 (Avg Cycle Time: 30s)
1267	SkillAssessment	2743	Created	Admin	2026-09-10 16:44:38.005471	Created Skill Rating 3 (Avg Cycle Time: 24s)
1269	SkillAssessment	2745	Created	Admin	2026-09-10 16:44:38.014178	Created Skill Rating 2 (Avg Cycle Time: 33s)
1270	SkillAssessment	2746	Created	Admin	2026-09-10 16:44:38.017871	Created Skill Rating 1 (Avg Cycle Time: 69s)
1271	SkillAssessment	2747	Created	Admin	2026-09-10 16:44:38.02792	Created Skill Rating 1 (Avg Cycle Time: 37s)
1273	SkillAssessment	2749	Created	Admin	2026-09-10 16:44:38.03929	Created Skill Rating 1 (Avg Cycle Time: 44s)
1274	SkillAssessment	2750	Created	Admin	2026-09-10 16:44:38.043957	Created Skill Rating 1 (Avg Cycle Time: 53s)
1276	SkillAssessment	2752	Created	Admin	2026-09-10 16:44:38.052173	Created Skill Rating 2 (Avg Cycle Time: 35s)
1277	SkillAssessment	2753	Created	Admin	2026-09-10 16:44:38.058176	Created Skill Rating 1 (Avg Cycle Time: 36s)
1279	SkillAssessment	2755	Created	Admin	2026-09-10 16:44:38.066048	Created Skill Rating 4 (Avg Cycle Time: 20s)
1280	SkillAssessment	2756	Created	Admin	2026-09-10 16:44:38.076745	Created Skill Rating 3 (Avg Cycle Time: 25s)
1281	SkillAssessment	2757	Created	Admin	2026-09-10 16:44:38.082986	Created Skill Rating 5 (Avg Cycle Time: 18s)
1283	SkillAssessment	2759	Created	Admin	2026-09-10 16:44:38.092208	Created Skill Rating 3 (Avg Cycle Time: 25s)
1284	SkillAssessment	2760	Created	Admin	2026-09-10 16:44:38.095915	Created Skill Rating 4 (Avg Cycle Time: 20s)
1286	SkillAssessment	2762	Created	Admin	2026-09-10 16:44:38.106605	Created Skill Rating 5 (Avg Cycle Time: 17s)
1287	SkillAssessment	2763	Created	Admin	2026-09-10 16:44:38.110714	Created Skill Rating 3 (Avg Cycle Time: 28s)
1289	SkillAssessment	2765	Created	Admin	2026-09-10 16:44:38.122173	Created Skill Rating 3 (Avg Cycle Time: 25s)
1290	SkillAssessment	2766	Created	Admin	2026-09-10 16:44:38.126881	Created Skill Rating 4 (Avg Cycle Time: 45s)
1291	SkillAssessment	2767	Created	Admin	2026-09-10 16:44:38.131889	Created Skill Rating 4 (Avg Cycle Time: 24s)
1293	SkillAssessment	2769	Created	Admin	2026-09-10 16:44:38.143124	Created Skill Rating 4 (Avg Cycle Time: 71s)
1294	SkillAssessment	2770	Created	Admin	2026-09-10 16:44:38.147844	Created Skill Rating 5 (Avg Cycle Time: 20s)
1296	SkillAssessment	2772	Created	Admin	2026-09-10 16:44:38.160527	Created Skill Rating 2 (Avg Cycle Time: 30s)
1297	SkillAssessment	2773	Created	Admin	2026-09-10 16:44:38.164987	Created Skill Rating 3 (Avg Cycle Time: 24s)
1299	SkillAssessment	2775	Created	Admin	2026-09-10 16:44:38.175439	Created Skill Rating 3 (Avg Cycle Time: 24s)
1300	SkillAssessment	2776	Created	Admin	2026-09-10 16:44:38.180012	Created Skill Rating 2 (Avg Cycle Time: 29s)
1301	SkillAssessment	2777	Created	Admin	2026-09-10 16:44:38.184024	Created Skill Rating 2 (Avg Cycle Time: 30s)
1303	SkillAssessment	2779	Created	Admin	2026-09-10 16:44:38.195406	Created Skill Rating 3 (Avg Cycle Time: 24s)
1304	SkillAssessment	2780	Created	Admin	2026-09-10 16:44:38.199969	Created Skill Rating 2 (Avg Cycle Time: 29s)
1306	SkillAssessment	2782	Created	Admin	2026-09-10 16:44:38.210702	Created Skill Rating 2 (Avg Cycle Time: 55s)
1307	SkillAssessment	2783	Created	Admin	2026-09-10 16:44:38.214781	Created Skill Rating 1 (Avg Cycle Time: 36s)
1309	SkillAssessment	2785	Created	Admin	2026-09-10 16:44:38.225324	Created Skill Rating 2 (Avg Cycle Time: 35s)
1310	SkillAssessment	2786	Created	Admin	2026-09-10 16:44:38.229848	Created Skill Rating 2 (Avg Cycle Time: 42s)
1311	SkillAssessment	2787	Created	Admin	2026-09-10 16:44:38.233909	Created Skill Rating 2 (Avg Cycle Time: 101s)
2353	CapacityPlan	5	Created	Admin	2026-09-12 12:41:47.87759	Created CapacityPlan #5
1228	SkillAssessment	2704	Created	Admin	2026-09-10 16:44:37.814013	Created Skill Rating 3 (Avg Cycle Time: 24s)
1232	SkillAssessment	2708	Created	Admin	2026-09-10 16:44:37.831952	Created Skill Rating 3 (Avg Cycle Time: 25s)
1235	SkillAssessment	2711	Created	Admin	2026-09-10 16:44:37.846498	Created Skill Rating 1 (Avg Cycle Time: 37s)
1238	SkillAssessment	2714	Created	Admin	2026-09-10 16:44:37.859448	Created Skill Rating 1 (Avg Cycle Time: 53s)
1242	SkillAssessment	2718	Created	Admin	2026-09-10 16:44:37.877022	Created Skill Rating 3 (Avg Cycle Time: 24s)
1245	SkillAssessment	2721	Created	Admin	2026-09-10 16:44:37.891131	Created Skill Rating 5 (Avg Cycle Time: 17s)
1248	SkillAssessment	2724	Created	Admin	2026-09-10 16:44:37.904969	Created Skill Rating 5 (Avg Cycle Time: 18s)
1252	SkillAssessment	2728	Created	Admin	2026-09-10 16:44:37.924752	Created Skill Rating 4 (Avg Cycle Time: 39s)
1255	SkillAssessment	2731	Created	Admin	2026-09-10 16:44:37.941194	Created Skill Rating 4 (Avg Cycle Time: 24s)
1258	SkillAssessment	2734	Created	Admin	2026-09-10 16:44:37.955638	Created Skill Rating 3 (Avg Cycle Time: 29s)
1262	SkillAssessment	2738	Created	Admin	2026-09-10 16:44:37.975741	Created Skill Rating 2 (Avg Cycle Time: 29s)
1265	SkillAssessment	2741	Created	Admin	2026-09-10 16:44:37.992103	Created Skill Rating 2 (Avg Cycle Time: 29s)
1268	SkillAssessment	2744	Created	Admin	2026-09-10 16:44:38.009173	Created Skill Rating 3 (Avg Cycle Time: 25s)
1272	SkillAssessment	2748	Created	Admin	2026-09-10 16:44:38.031865	Created Skill Rating 1 (Avg Cycle Time: 78s)
1275	SkillAssessment	2751	Created	Admin	2026-09-10 16:44:38.048125	Created Skill Rating 1 (Avg Cycle Time: 126s)
1278	SkillAssessment	2754	Created	Admin	2026-09-10 16:44:38.062371	Created Skill Rating 3 (Avg Cycle Time: 25s)
1282	SkillAssessment	2758	Created	Admin	2026-09-10 16:44:38.088102	Created Skill Rating 3 (Avg Cycle Time: 25s)
1285	SkillAssessment	2761	Created	Admin	2026-09-10 16:44:38.100897	Created Skill Rating 5 (Avg Cycle Time: 17s)
1288	SkillAssessment	2764	Created	Admin	2026-09-10 16:44:38.115058	Created Skill Rating 4 (Avg Cycle Time: 38s)
1292	SkillAssessment	2768	Created	Admin	2026-09-10 16:44:38.138113	Created Skill Rating 3 (Avg Cycle Time: 35s)
1295	SkillAssessment	2771	Created	Admin	2026-09-10 16:44:38.155955	Created Skill Rating 4 (Avg Cycle Time: 20s)
1298	SkillAssessment	2774	Created	Admin	2026-09-10 16:44:38.169985	Created Skill Rating 3 (Avg Cycle Time: 25s)
1302	SkillAssessment	2778	Created	Admin	2026-09-10 16:44:38.190284	Created Skill Rating 2 (Avg Cycle Time: 30s)
1305	SkillAssessment	2781	Created	Admin	2026-09-10 16:44:38.206457	Created Skill Rating 2 (Avg Cycle Time: 34s)
1308	SkillAssessment	2784	Created	Admin	2026-09-10 16:44:38.220762	Created Skill Rating 1 (Avg Cycle Time: 79s)
1312	SkillAssessment	2788	Created	Admin	2026-09-10 16:44:38.240939	Created Skill Rating 1 (Avg Cycle Time: 43s)
1315	SkillAssessment	2791	Created	Admin	2026-09-10 16:44:38.257874	Created Skill Rating 4 (Avg Cycle Time: 20s)
1318	SkillAssessment	2794	Created	Admin	2026-09-10 16:44:38.268817	Created Skill Rating 3 (Avg Cycle Time: 24s)
1322	SkillAssessment	2798	Created	Admin	2026-09-10 16:44:38.291889	Created Skill Rating 4 (Avg Cycle Time: 21s)
1325	SkillAssessment	2801	Created	Admin	2026-09-10 16:44:38.306743	Created Skill Rating 5 (Avg Cycle Time: 18s)
1328	SkillAssessment	2804	Created	Admin	2026-09-10 16:44:38.319266	Created Skill Rating 4 (Avg Cycle Time: 29s)
1332	SkillAssessment	2808	Created	Admin	2026-09-10 16:44:38.339036	Created Skill Rating 2 (Avg Cycle Time: 29s)
1335	SkillAssessment	2811	Created	Admin	2026-09-10 16:44:38.350364	Created Skill Rating 2 (Avg Cycle Time: 30s)
1338	SkillAssessment	2814	Created	Admin	2026-09-10 16:44:38.365612	Created Skill Rating 2 (Avg Cycle Time: 30s)
1342	SkillAssessment	2818	Created	Admin	2026-09-10 16:44:38.384804	Created Skill Rating 2 (Avg Cycle Time: 55s)
1345	SkillAssessment	2821	Created	Admin	2026-09-10 16:44:38.399156	Created Skill Rating 2 (Avg Cycle Time: 36s)
1348	SkillAssessment	2824	Created	Admin	2026-09-10 16:44:38.41176	Created Skill Rating 3 (Avg Cycle Time: 28s)
1352	SkillAssessment	2828	Created	Admin	2026-09-10 16:44:38.430741	Created Skill Rating 5 (Avg Cycle Time: 17s)
1355	SkillAssessment	2831	Created	Admin	2026-09-10 16:44:38.446231	Created Skill Rating 5 (Avg Cycle Time: 18s)
1358	SkillAssessment	2834	Created	Admin	2026-09-10 16:44:38.459434	Created Skill Rating 3 (Avg Cycle Time: 25s)
1362	SkillAssessment	2838	Created	Admin	2026-09-10 16:44:38.479015	Created Skill Rating 5 (Avg Cycle Time: 37s)
1365	SkillAssessment	2841	Created	Admin	2026-09-10 16:44:38.495362	Created Skill Rating 3 (Avg Cycle Time: 84s)
1368	SkillAssessment	2844	Created	Admin	2026-09-10 16:44:38.510099	Created Skill Rating 3 (Avg Cycle Time: 24s)
1372	SkillAssessment	2848	Created	Admin	2026-09-10 16:44:38.528754	Created Skill Rating 3 (Avg Cycle Time: 24s)
1375	SkillAssessment	2851	Created	Admin	2026-09-10 16:44:38.542816	Created Skill Rating 3 (Avg Cycle Time: 25s)
1378	SkillAssessment	2854	Created	Admin	2026-09-10 16:44:38.558231	Created Skill Rating 1 (Avg Cycle Time: 68s)
1382	SkillAssessment	2858	Created	Admin	2026-09-10 16:44:38.576851	Created Skill Rating 1 (Avg Cycle Time: 53s)
1385	SkillAssessment	2861	Created	Admin	2026-09-10 16:44:38.592029	Created Skill Rating 1 (Avg Cycle Time: 37s)
1388	SkillAssessment	2864	Created	Admin	2026-09-10 16:44:38.605725	Created Skill Rating 2 (Avg Cycle Time: 29s)
1392	SkillAssessment	2868	Created	Admin	2026-09-10 16:44:38.624732	Created Skill Rating 4 (Avg Cycle Time: 21s)
1395	SkillAssessment	2871	Created	Admin	2026-09-10 16:44:38.639755	Created Skill Rating 4 (Avg Cycle Time: 24s)
1398	SkillAssessment	2874	Created	Admin	2026-09-10 16:44:38.651873	Created Skill Rating 3 (Avg Cycle Time: 53s)
1402	SkillAssessment	2878	Created	Admin	2026-09-10 16:44:38.674023	Created Skill Rating 5 (Avg Cycle Time: 21s)
1405	SkillAssessment	2881	Created	Admin	2026-09-10 16:44:38.688351	Created Skill Rating 2 (Avg Cycle Time: 30s)
1408	SkillAssessment	2884	Created	Admin	2026-09-10 16:44:38.700417	Created Skill Rating 3 (Avg Cycle Time: 25s)
1412	SkillAssessment	2888	Created	Admin	2026-09-10 16:44:38.721046	Created Skill Rating 3 (Avg Cycle Time: 24s)
1415	SkillAssessment	2891	Created	Admin	2026-09-10 16:44:38.732915	Created Skill Rating 1 (Avg Cycle Time: 36s)
1418	SkillAssessment	2894	Created	Admin	2026-09-10 16:44:38.748258	Created Skill Rating 1 (Avg Cycle Time: 52s)
1422	SkillAssessment	2898	Created	Admin	2026-09-10 16:44:38.766657	Created Skill Rating 3 (Avg Cycle Time: 24s)
1425	SkillAssessment	2901	Created	Admin	2026-09-10 16:44:38.782946	Created Skill Rating 3 (Avg Cycle Time: 25s)
1428	SkillAssessment	2904	Created	Admin	2026-09-10 16:44:38.79597	Created Skill Rating 3 (Avg Cycle Time: 25s)
2357	CapacityPlan	6	Created	Admin	2026-09-12 12:59:20.400322	Created CapacityPlan #6
1313	SkillAssessment	2789	Created	Admin	2026-09-10 16:44:38.246196	Created Skill Rating 2 (Avg Cycle Time: 30s)
1314	SkillAssessment	2790	Created	Admin	2026-09-10 16:44:38.250284	Created Skill Rating 2 (Avg Cycle Time: 29s)
1316	SkillAssessment	2792	Created	Admin	2026-09-10 16:44:38.260587	Created Skill Rating 2 (Avg Cycle Time: 29s)
1317	SkillAssessment	2793	Created	Admin	2026-09-10 16:44:38.2649	Created Skill Rating 5 (Avg Cycle Time: 17s)
1319	SkillAssessment	2795	Created	Admin	2026-09-10 16:44:38.274502	Created Skill Rating 2 (Avg Cycle Time: 29s)
1320	SkillAssessment	2796	Created	Admin	2026-09-10 16:44:38.279254	Created Skill Rating 4 (Avg Cycle Time: 21s)
1321	SkillAssessment	2797	Created	Admin	2026-09-10 16:44:38.283967	Created Skill Rating 5 (Avg Cycle Time: 17s)
1323	SkillAssessment	2799	Created	Admin	2026-09-10 16:44:38.296398	Created Skill Rating 4 (Avg Cycle Time: 23s)
1324	SkillAssessment	2800	Created	Admin	2026-09-10 16:44:38.300056	Created Skill Rating 4 (Avg Cycle Time: 38s)
1326	SkillAssessment	2802	Created	Admin	2026-09-10 16:44:38.310296	Created Skill Rating 4 (Avg Cycle Time: 45s)
1327	SkillAssessment	2803	Created	Admin	2026-09-10 16:44:38.314531	Created Skill Rating 4 (Avg Cycle Time: 25s)
1329	SkillAssessment	2805	Created	Admin	2026-09-10 16:44:38.325648	Created Skill Rating 4 (Avg Cycle Time: 71s)
1330	SkillAssessment	2806	Created	Admin	2026-09-10 16:44:38.328264	Created Skill Rating 3 (Avg Cycle Time: 29s)
1331	SkillAssessment	2807	Created	Admin	2026-09-10 16:44:38.333063	Created Skill Rating 5 (Avg Cycle Time: 17s)
1333	SkillAssessment	2809	Created	Admin	2026-09-10 16:44:38.342989	Created Skill Rating 3 (Avg Cycle Time: 25s)
1334	SkillAssessment	2810	Created	Admin	2026-09-10 16:44:38.34675	Created Skill Rating 2 (Avg Cycle Time: 29s)
1336	SkillAssessment	2812	Created	Admin	2026-09-10 16:44:38.35729	Created Skill Rating 3 (Avg Cycle Time: 24s)
1337	SkillAssessment	2813	Created	Admin	2026-09-10 16:44:38.360983	Created Skill Rating 3 (Avg Cycle Time: 24s)
1339	SkillAssessment	2815	Created	Admin	2026-09-10 16:44:38.370298	Created Skill Rating 2 (Avg Cycle Time: 30s)
1340	SkillAssessment	2816	Created	Admin	2026-09-10 16:44:38.375601	Created Skill Rating 3 (Avg Cycle Time: 24s)
1341	SkillAssessment	2817	Created	Admin	2026-09-10 16:44:38.380205	Created Skill Rating 2 (Avg Cycle Time: 33s)
1343	SkillAssessment	2819	Created	Admin	2026-09-10 16:44:38.389837	Created Skill Rating 2 (Avg Cycle Time: 29s)
1344	SkillAssessment	2820	Created	Admin	2026-09-10 16:44:38.393839	Created Skill Rating 2 (Avg Cycle Time: 64s)
1346	SkillAssessment	2822	Created	Admin	2026-09-10 16:44:38.40415	Created Skill Rating 3 (Avg Cycle Time: 35s)
1347	SkillAssessment	2823	Created	Admin	2026-09-10 16:44:38.407846	Created Skill Rating 2 (Avg Cycle Time: 101s)
1349	SkillAssessment	2825	Created	Admin	2026-09-10 16:44:38.416474	Created Skill Rating 3 (Avg Cycle Time: 24s)
1350	SkillAssessment	2826	Created	Admin	2026-09-10 16:44:38.423091	Created Skill Rating 5 (Avg Cycle Time: 17s)
1351	SkillAssessment	2827	Created	Admin	2026-09-10 16:44:38.4268	Created Skill Rating 4 (Avg Cycle Time: 21s)
1353	SkillAssessment	2829	Created	Admin	2026-09-10 16:44:38.436007	Created Skill Rating 4 (Avg Cycle Time: 20s)
1354	SkillAssessment	2830	Created	Admin	2026-09-10 16:44:38.44203	Created Skill Rating 5 (Avg Cycle Time: 17s)
1356	SkillAssessment	2832	Created	Admin	2026-09-10 16:44:38.450217	Created Skill Rating 3 (Avg Cycle Time: 24s)
1357	SkillAssessment	2833	Created	Admin	2026-09-10 16:44:38.454836	Created Skill Rating 4 (Avg Cycle Time: 21s)
1359	SkillAssessment	2835	Created	Admin	2026-09-10 16:44:38.464107	Created Skill Rating 5 (Avg Cycle Time: 20s)
1360	SkillAssessment	2836	Created	Admin	2026-09-10 16:44:38.467915	Created Skill Rating 4 (Avg Cycle Time: 38s)
1361	SkillAssessment	2837	Created	Admin	2026-09-10 16:44:38.473985	Created Skill Rating 3 (Avg Cycle Time: 25s)
1363	SkillAssessment	2839	Created	Admin	2026-09-10 16:44:38.483014	Created Skill Rating 5 (Avg Cycle Time: 21s)
1364	SkillAssessment	2840	Created	Admin	2026-09-10 16:44:38.489156	Created Skill Rating 5 (Avg Cycle Time: 24s)
1366	SkillAssessment	2842	Created	Admin	2026-09-10 16:44:38.49993	Created Skill Rating 4 (Avg Cycle Time: 25s)
1367	SkillAssessment	2843	Created	Admin	2026-09-10 16:44:38.505592	Created Skill Rating 4 (Avg Cycle Time: 20s)
1369	SkillAssessment	2845	Created	Admin	2026-09-10 16:44:38.514132	Created Skill Rating 3 (Avg Cycle Time: 24s)
1370	SkillAssessment	2846	Created	Admin	2026-09-10 16:44:38.518197	Created Skill Rating 3 (Avg Cycle Time: 24s)
1371	SkillAssessment	2847	Created	Admin	2026-09-10 16:44:38.524762	Created Skill Rating 2 (Avg Cycle Time: 30s)
1373	SkillAssessment	2849	Created	Admin	2026-09-10 16:44:38.531756	Created Skill Rating 2 (Avg Cycle Time: 29s)
1374	SkillAssessment	2850	Created	Admin	2026-09-10 16:44:38.538816	Created Skill Rating 2 (Avg Cycle Time: 30s)
1376	SkillAssessment	2852	Created	Admin	2026-09-10 16:44:38.546355	Created Skill Rating 2 (Avg Cycle Time: 29s)
1377	SkillAssessment	2853	Created	Admin	2026-09-10 16:44:38.551886	Created Skill Rating 1 (Avg Cycle Time: 42s)
1379	SkillAssessment	2855	Created	Admin	2026-09-10 16:44:38.562929	Created Skill Rating 1 (Avg Cycle Time: 37s)
1380	SkillAssessment	2856	Created	Admin	2026-09-10 16:44:38.566537	Created Skill Rating 2 (Avg Cycle Time: 62s)
1381	SkillAssessment	2857	Created	Admin	2026-09-10 16:44:38.572236	Created Skill Rating 2 (Avg Cycle Time: 35s)
1383	SkillAssessment	2859	Created	Admin	2026-09-10 16:44:38.580941	Created Skill Rating 1 (Avg Cycle Time: 126s)
1384	SkillAssessment	2860	Created	Admin	2026-09-10 16:44:38.585434	Created Skill Rating 1 (Avg Cycle Time: 44s)
1386	SkillAssessment	2862	Created	Admin	2026-09-10 16:44:38.595721	Created Skill Rating 3 (Avg Cycle Time: 24s)
1387	SkillAssessment	2863	Created	Admin	2026-09-10 16:44:38.600029	Created Skill Rating 5 (Avg Cycle Time: 17s)
1389	SkillAssessment	2865	Created	Admin	2026-09-10 16:44:38.610432	Created Skill Rating 4 (Avg Cycle Time: 21s)
1390	SkillAssessment	2866	Created	Admin	2026-09-10 16:44:38.614621	Created Skill Rating 2 (Avg Cycle Time: 29s)
1391	SkillAssessment	2867	Created	Admin	2026-09-10 16:44:38.619364	Created Skill Rating 2 (Avg Cycle Time: 29s)
1393	SkillAssessment	2869	Created	Admin	2026-09-10 16:44:38.628406	Created Skill Rating 4 (Avg Cycle Time: 20s)
1394	SkillAssessment	2870	Created	Admin	2026-09-10 16:44:38.633156	Created Skill Rating 5 (Avg Cycle Time: 17s)
1396	SkillAssessment	2872	Created	Admin	2026-09-10 16:44:38.644459	Created Skill Rating 3 (Avg Cycle Time: 45s)
1397	SkillAssessment	2873	Created	Admin	2026-09-10 16:44:38.64816	Created Skill Rating 3 (Avg Cycle Time: 25s)
1399	SkillAssessment	2875	Created	Admin	2026-09-10 16:44:38.65829	Created Skill Rating 4 (Avg Cycle Time: 25s)
2358	CapacityPlan	6	Updated	Admin	2026-09-12 12:59:20.441064	Updated CapacityPlan #6
1400	SkillAssessment	2876	Created	Admin	2026-09-10 16:44:38.662989	Created Skill Rating 3 (Avg Cycle Time: 35s)
1401	SkillAssessment	2877	Created	Admin	2026-09-10 16:44:38.666541	Created Skill Rating 5 (Avg Cycle Time: 59s)
1403	SkillAssessment	2879	Created	Admin	2026-09-10 16:44:38.679129	Created Skill Rating 4 (Avg Cycle Time: 21s)
1404	SkillAssessment	2880	Created	Admin	2026-09-10 16:44:38.682119	Created Skill Rating 2 (Avg Cycle Time: 30s)
1406	SkillAssessment	2882	Created	Admin	2026-09-10 16:44:38.692907	Created Skill Rating 2 (Avg Cycle Time: 29s)
1407	SkillAssessment	2883	Created	Admin	2026-09-10 16:44:38.696437	Created Skill Rating 3 (Avg Cycle Time: 25s)
1409	SkillAssessment	2885	Created	Admin	2026-09-10 16:44:38.70647	Created Skill Rating 2 (Avg Cycle Time: 29s)
1410	SkillAssessment	2886	Created	Admin	2026-09-10 16:44:38.711003	Created Skill Rating 2 (Avg Cycle Time: 29s)
1411	SkillAssessment	2887	Created	Admin	2026-09-10 16:44:38.714581	Created Skill Rating 3 (Avg Cycle Time: 25s)
1413	SkillAssessment	2889	Created	Admin	2026-09-10 16:44:38.725939	Created Skill Rating 1 (Avg Cycle Time: 42s)
1414	SkillAssessment	2890	Created	Admin	2026-09-10 16:44:38.729909	Created Skill Rating 1 (Avg Cycle Time: 68s)
1416	SkillAssessment	2892	Created	Admin	2026-09-10 16:44:38.739901	Created Skill Rating 1 (Avg Cycle Time: 78s)
1417	SkillAssessment	2893	Created	Admin	2026-09-10 16:44:38.744561	Created Skill Rating 2 (Avg Cycle Time: 35s)
1419	SkillAssessment	2895	Created	Admin	2026-09-10 16:44:38.751886	Created Skill Rating 1 (Avg Cycle Time: 126s)
1420	SkillAssessment	2896	Created	Admin	2026-09-10 16:44:38.758227	Created Skill Rating 1 (Avg Cycle Time: 44s)
1421	SkillAssessment	2897	Created	Admin	2026-09-10 16:44:38.762942	Created Skill Rating 1 (Avg Cycle Time: 36s)
1423	SkillAssessment	2899	Created	Admin	2026-09-10 16:44:38.772971	Created Skill Rating 3 (Avg Cycle Time: 24s)
1424	SkillAssessment	2900	Created	Admin	2026-09-10 16:44:38.778315	Created Skill Rating 2 (Avg Cycle Time: 29s)
1426	SkillAssessment	2902	Created	Admin	2026-09-10 16:44:38.788149	Created Skill Rating 3 (Avg Cycle Time: 24s)
1427	SkillAssessment	2903	Created	Admin	2026-09-10 16:44:38.792258	Created Skill Rating 2 (Avg Cycle Time: 29s)
1429	SkillAssessment	2905	Created	Admin	2026-09-10 16:44:38.800424	Created Skill Rating 3 (Avg Cycle Time: 24s)
1430	SkillAssessment	2906	Created	Admin	2026-09-10 16:44:38.806367	Created Skill Rating 4 (Avg Cycle Time: 21s)
1431	SkillAssessment	2907	Created	Admin	2026-09-10 16:44:38.811065	Created Skill Rating 5 (Avg Cycle Time: 19s)
1433	SkillAssessment	2909	Created	Admin	2026-09-10 16:44:38.822773	Created Skill Rating 4 (Avg Cycle Time: 20s)
1434	SkillAssessment	2910	Created	Admin	2026-09-10 16:44:38.827131	Created Skill Rating 4 (Avg Cycle Time: 44s)
1436	SkillAssessment	2912	Created	Admin	2026-09-10 16:44:38.835504	Created Skill Rating 5 (Avg Cycle Time: 24s)
1437	SkillAssessment	2913	Created	Admin	2026-09-10 16:44:38.842034	Created Skill Rating 4 (Avg Cycle Time: 70s)
1439	SkillAssessment	2915	Created	Admin	2026-09-10 16:44:38.849275	Created Skill Rating 5 (Avg Cycle Time: 17s)
1440	SkillAssessment	2916	Created	Admin	2026-09-10 16:44:38.856624	Created Skill Rating 4 (Avg Cycle Time: 20s)
1441	SkillAssessment	2917	Created	Admin	2026-09-10 16:44:38.860966	Created Skill Rating 4 (Avg Cycle Time: 20s)
1443	SkillAssessment	2919	Created	Admin	2026-09-10 16:44:38.871807	Created Skill Rating 4 (Avg Cycle Time: 21s)
1444	SkillAssessment	2920	Created	Admin	2026-09-10 16:44:38.876938	Created Skill Rating 5 (Avg Cycle Time: 17s)
1446	SkillAssessment	2922	Created	Admin	2026-09-10 16:44:38.88555	Created Skill Rating 4 (Avg Cycle Time: 21s)
1447	SkillAssessment	2923	Created	Admin	2026-09-10 16:44:38.890232	Created Skill Rating 4 (Avg Cycle Time: 21s)
1449	SkillAssessment	2925	Created	Admin	2026-09-10 16:44:38.899844	Created Skill Rating 4 (Avg Cycle Time: 24s)
1450	SkillAssessment	2926	Created	Admin	2026-09-10 16:44:38.906222	Created Skill Rating 4 (Avg Cycle Time: 38s)
1451	SkillAssessment	2927	Created	Admin	2026-09-10 16:44:38.912221	Created Skill Rating 3 (Avg Cycle Time: 24s)
1453	SkillAssessment	2929	Created	Admin	2026-09-10 16:44:38.924516	Created Skill Rating 3 (Avg Cycle Time: 28s)
1454	SkillAssessment	2930	Created	Admin	2026-09-10 16:44:38.928208	Created Skill Rating 4 (Avg Cycle Time: 30s)
1456	SkillAssessment	2932	Created	Admin	2026-09-10 16:44:38.93859	Created Skill Rating 4 (Avg Cycle Time: 25s)
1457	SkillAssessment	2933	Created	Admin	2026-09-10 16:44:38.94429	Created Skill Rating 4 (Avg Cycle Time: 20s)
1459	SkillAssessment	2935	Created	Admin	2026-09-10 16:44:38.952484	Created Skill Rating 2 (Avg Cycle Time: 29s)
1460	SkillAssessment	2936	Created	Admin	2026-09-10 16:44:38.959067	Created Skill Rating 2 (Avg Cycle Time: 29s)
1461	SkillAssessment	2937	Created	Admin	2026-09-10 16:44:38.962437	Created Skill Rating 2 (Avg Cycle Time: 30s)
1463	SkillAssessment	2939	Created	Admin	2026-09-10 16:44:38.972914	Created Skill Rating 3 (Avg Cycle Time: 25s)
1464	SkillAssessment	2940	Created	Admin	2026-09-10 16:44:38.97667	Created Skill Rating 2 (Avg Cycle Time: 30s)
1466	SkillAssessment	2942	Created	Admin	2026-09-10 16:44:38.988141	Created Skill Rating 2 (Avg Cycle Time: 30s)
1858	SkillAssessment	3138	Created	Admin	2026-09-10 16:45:34.458851	Created Skill Rating 3 (Avg Cycle Time: 47s)
1859	OperatorPerformanceLog	222	Created	Admin	2026-09-10 16:45:34.466871	Created Performance Timing Test (23s · SUBMITTED)
1860	SkillAssessment	3139	Created	Admin	2026-09-10 16:45:34.473982	Created Skill Rating 5 (Avg Cycle Time: 23s)
1863	OperatorPerformanceLog	224	Created	Admin	2026-09-10 16:45:34.496373	Created Performance Timing Test (65s · SUBMITTED)
1864	SkillAssessment	3141	Created	Admin	2026-09-10 16:45:34.50502	Created Skill Rating 1 (Avg Cycle Time: 65s)
1869	OperatorPerformanceLog	227	Created	Admin	2026-09-10 16:45:34.533934	Created Performance Timing Test (34s · SUBMITTED)
1870	SkillAssessment	3144	Created	Admin	2026-09-10 16:45:34.539039	Created Skill Rating 3 (Avg Cycle Time: 35s)
1871	OperatorPerformanceLog	228	Created	Admin	2026-09-10 16:45:34.543043	Created Performance Timing Test (56s · SUBMITTED)
1872	SkillAssessment	3145	Created	Admin	2026-09-10 16:45:34.550442	Created Skill Rating 2 (Avg Cycle Time: 56s)
1873	OperatorPerformanceLog	229	Created	Admin	2026-09-10 16:45:34.557392	Created Performance Timing Test (54s · SUBMITTED)
1874	SkillAssessment	3146	Created	Admin	2026-09-10 16:45:34.564716	Created Skill Rating 2 (Avg Cycle Time: 55s)
1875	OperatorPerformanceLog	230	Created	Admin	2026-09-10 16:45:34.572294	Created Performance Timing Test (32s · SUBMITTED)
1876	SkillAssessment	3147	Created	Admin	2026-09-10 16:45:34.580865	Created Skill Rating 5 (Avg Cycle Time: 32s)
1877	OperatorPerformanceLog	231	Created	Admin	2026-09-10 16:45:34.590139	Created Performance Timing Test (30s · SUBMITTED)
1432	SkillAssessment	2908	Created	Admin	2026-09-10 16:44:38.814209	Created Skill Rating 5 (Avg Cycle Time: 32s)
1435	SkillAssessment	2911	Created	Admin	2026-09-10 16:44:38.83041	Created Skill Rating 5 (Avg Cycle Time: 21s)
1438	SkillAssessment	2914	Created	Admin	2026-09-10 16:44:38.846024	Created Skill Rating 5 (Avg Cycle Time: 20s)
1442	SkillAssessment	2918	Created	Admin	2026-09-10 16:44:38.86665	Created Skill Rating 5 (Avg Cycle Time: 17s)
1445	SkillAssessment	2921	Created	Admin	2026-09-10 16:44:38.882	Created Skill Rating 4 (Avg Cycle Time: 21s)
1448	SkillAssessment	2924	Created	Admin	2026-09-10 16:44:38.893826	Created Skill Rating 4 (Avg Cycle Time: 21s)
1452	SkillAssessment	2928	Created	Admin	2026-09-10 16:44:38.917964	Created Skill Rating 4 (Avg Cycle Time: 44s)
1455	SkillAssessment	2931	Created	Admin	2026-09-10 16:44:38.931851	Created Skill Rating 3 (Avg Cycle Time: 84s)
1458	SkillAssessment	2934	Created	Admin	2026-09-10 16:44:38.94798	Created Skill Rating 3 (Avg Cycle Time: 25s)
1462	SkillAssessment	2938	Created	Admin	2026-09-10 16:44:38.966066	Created Skill Rating 3 (Avg Cycle Time: 25s)
1465	SkillAssessment	2941	Created	Admin	2026-09-10 16:44:38.982214	Created Skill Rating 3 (Avg Cycle Time: 24s)
1878	SkillAssessment	3148	Created	Admin	2026-09-10 16:45:34.600951	Created Skill Rating 5 (Avg Cycle Time: 31s)
1879	OperatorPerformanceLog	232	Created	Admin	2026-09-10 16:45:34.610182	Created Performance Timing Test (64s · SUBMITTED)
1880	SkillAssessment	3149	Created	Admin	2026-09-10 16:45:34.620009	Created Skill Rating 1 (Avg Cycle Time: 64s)
1883	OperatorPerformanceLog	234	Created	Admin	2026-09-10 16:45:34.650814	Created Performance Timing Test (30s · SUBMITTED)
1884	SkillAssessment	3151	Created	Admin	2026-09-10 16:45:34.658858	Created Skill Rating 4 (Avg Cycle Time: 30s)
1889	OperatorPerformanceLog	237	Created	Admin	2026-09-10 16:45:34.693209	Created Performance Timing Test (45s · SUBMITTED)
1890	SkillAssessment	3154	Created	Admin	2026-09-10 16:45:34.70216	Created Skill Rating 3 (Avg Cycle Time: 46s)
1891	OperatorPerformanceLog	238	Created	Admin	2026-09-10 16:45:34.706225	Created Performance Timing Test (23s · SUBMITTED)
1892	SkillAssessment	3155	Created	Admin	2026-09-10 16:45:34.712244	Created Skill Rating 5 (Avg Cycle Time: 23s)
1893	OperatorPerformanceLog	239	Created	Admin	2026-09-10 16:45:34.720247	Created Performance Timing Test (21s · SUBMITTED)
1894	SkillAssessment	3156	Created	Admin	2026-09-10 16:45:34.725849	Created Skill Rating 5 (Avg Cycle Time: 22s)
1895	OperatorPerformanceLog	240	Created	Admin	2026-09-10 16:45:34.732334	Created Performance Timing Test (46s · SUBMITTED)
1896	SkillAssessment	3157	Created	Admin	2026-09-10 16:45:34.737969	Created Skill Rating 3 (Avg Cycle Time: 46s)
1897	OperatorPerformanceLog	241	Created	Admin	2026-09-10 16:45:34.745628	Created Performance Timing Test (44s · SUBMITTED)
1898	SkillAssessment	3158	Created	Admin	2026-09-10 16:45:34.754156	Created Skill Rating 3 (Avg Cycle Time: 45s)
1899	OperatorPerformanceLog	242	Created	Admin	2026-09-10 16:45:34.760692	Created Performance Timing Test (43s · SUBMITTED)
1900	SkillAssessment	3159	Created	Admin	2026-09-10 16:45:34.769881	Created Skill Rating 1 (Avg Cycle Time: 43s)
1903	OperatorPerformanceLog	244	Created	Admin	2026-09-10 16:45:34.796228	Created Performance Timing Test (70s · SUBMITTED)
1904	SkillAssessment	3161	Created	Admin	2026-09-10 16:45:34.803879	Created Skill Rating 1 (Avg Cycle Time: 70s)
1909	OperatorPerformanceLog	247	Created	Admin	2026-09-10 16:45:34.83905	Created Performance Timing Test (37s · SUBMITTED)
1910	SkillAssessment	3164	Created	Admin	2026-09-10 16:45:34.84635	Created Skill Rating 4 (Avg Cycle Time: 38s)
1911	OperatorPerformanceLog	248	Created	Admin	2026-09-10 16:45:34.855536	Created Performance Timing Test (81s · SUBMITTED)
1912	SkillAssessment	3165	Created	Admin	2026-09-10 16:45:34.863103	Created Skill Rating 1 (Avg Cycle Time: 81s)
1913	OperatorPerformanceLog	249	Created	Admin	2026-09-10 16:45:34.870213	Created Performance Timing Test (79s · SUBMITTED)
1914	SkillAssessment	3166	Created	Admin	2026-09-10 16:45:34.878322	Created Skill Rating 1 (Avg Cycle Time: 80s)
1915	OperatorPerformanceLog	250	Created	Admin	2026-09-10 16:45:34.886956	Created Performance Timing Test (22s · SUBMITTED)
1916	SkillAssessment	3167	Created	Admin	2026-09-10 16:45:34.894106	Created Skill Rating 5 (Avg Cycle Time: 22s)
1917	OperatorPerformanceLog	251	Created	Admin	2026-09-10 16:45:34.905203	Created Performance Timing Test (20s · SUBMITTED)
1918	SkillAssessment	3168	Created	Admin	2026-09-10 16:45:34.911262	Created Skill Rating 5 (Avg Cycle Time: 21s)
1919	OperatorPerformanceLog	252	Created	Admin	2026-09-10 16:45:34.920299	Created Performance Timing Test (34s · SUBMITTED)
1920	SkillAssessment	3169	Created	Admin	2026-09-10 16:45:34.925836	Created Skill Rating 5 (Avg Cycle Time: 34s)
1923	OperatorPerformanceLog	254	Created	Admin	2026-09-10 16:45:34.947195	Created Performance Timing Test (19s · SUBMITTED)
1924	SkillAssessment	3171	Created	Admin	2026-09-10 16:45:34.955891	Created Skill Rating 5 (Avg Cycle Time: 19s)
1929	OperatorPerformanceLog	257	Created	Admin	2026-09-10 16:45:34.995693	Created Performance Timing Test (36s · SUBMITTED)
1930	SkillAssessment	3174	Created	Admin	2026-09-10 16:45:35.005714	Created Skill Rating 5 (Avg Cycle Time: 37s)
1931	OperatorPerformanceLog	258	Created	Admin	2026-09-10 16:45:35.016494	Created Performance Timing Test (36s · SUBMITTED)
1932	SkillAssessment	3175	Created	Admin	2026-09-10 16:45:35.023898	Created Skill Rating 3 (Avg Cycle Time: 36s)
1933	OperatorPerformanceLog	259	Created	Admin	2026-09-10 16:45:35.034599	Created Performance Timing Test (34s · SUBMITTED)
1934	SkillAssessment	3176	Created	Admin	2026-09-10 16:45:35.042416	Created Skill Rating 3 (Avg Cycle Time: 35s)
1935	OperatorPerformanceLog	260	Created	Admin	2026-09-10 16:45:35.053059	Created Performance Timing Test (56s · SUBMITTED)
1936	SkillAssessment	3177	Created	Admin	2026-09-10 16:45:35.062597	Created Skill Rating 2 (Avg Cycle Time: 56s)
1937	OperatorPerformanceLog	261	Created	Admin	2026-09-10 16:45:35.071261	Created Performance Timing Test (54s · SUBMITTED)
1938	SkillAssessment	3178	Created	Admin	2026-09-10 16:45:35.081978	Created Skill Rating 2 (Avg Cycle Time: 55s)
1939	OperatorPerformanceLog	262	Created	Admin	2026-09-10 16:45:35.090623	Created Performance Timing Test (31s · SUBMITTED)
1940	SkillAssessment	3179	Created	Admin	2026-09-10 16:45:35.102208	Created Skill Rating 5 (Avg Cycle Time: 31s)
1943	OperatorPerformanceLog	264	Created	Admin	2026-09-10 16:45:35.124146	Created Performance Timing Test (66s · SUBMITTED)
1944	SkillAssessment	3181	Created	Admin	2026-09-10 16:45:35.132377	Created Skill Rating 1 (Avg Cycle Time: 66s)
2269	Notification	43	Updated	Admin	2026-09-10 16:53:48.060759	Updated Notification #43
1967	OperatorPerformanceLog	276	Created	Admin	2026-09-10 16:45:35.310043	Created Performance Timing Test (57s · SUBMITTED)
1968	SkillAssessment	3193	Created	Admin	2026-09-10 16:45:35.319011	Created Skill Rating 2 (Avg Cycle Time: 57s)
1981	OperatorPerformanceLog	283	Created	Admin	2026-09-10 16:45:35.422064	Created Performance Timing Test (23s · SUBMITTED)
1982	SkillAssessment	3200	Created	Admin	2026-09-10 16:45:35.428405	Created Skill Rating 5 (Avg Cycle Time: 24s)
1987	OperatorPerformanceLog	286	Created	Admin	2026-09-10 16:45:35.467501	Created Performance Timing Test (22s · SUBMITTED)
1988	SkillAssessment	3203	Created	Admin	2026-09-10 16:45:35.472037	Created Skill Rating 5 (Avg Cycle Time: 22s)
2001	OperatorPerformanceLog	293	Created	Admin	2026-09-10 16:45:35.572963	Created Performance Timing Test (68s · SUBMITTED)
2002	SkillAssessment	3210	Created	Admin	2026-09-10 16:45:35.582178	Created Skill Rating 1 (Avg Cycle Time: 69s)
2007	OperatorPerformanceLog	296	Created	Admin	2026-09-10 16:45:35.630553	Created Performance Timing Test (81s · SUBMITTED)
2008	SkillAssessment	3213	Created	Admin	2026-09-10 16:45:35.640182	Created Skill Rating 1 (Avg Cycle Time: 81s)
2021	OperatorPerformanceLog	303	Created	Admin	2026-09-10 16:45:35.750438	Created Performance Timing Test (21s · SUBMITTED)
2022	SkillAssessment	3220	Created	Admin	2026-09-10 16:45:35.756428	Created Skill Rating 5 (Avg Cycle Time: 22s)
2027	OperatorPerformanceLog	306	Created	Admin	2026-09-10 16:45:35.806904	Created Performance Timing Test (35s · SUBMITTED)
2028	SkillAssessment	3223	Created	Admin	2026-09-10 16:45:35.818002	Created Skill Rating 3 (Avg Cycle Time: 35s)
2041	OperatorPerformanceLog	313	Created	Admin	2026-09-10 16:45:35.959216	Created Performance Timing Test (52s · SUBMITTED)
2042	SkillAssessment	3230	Created	Admin	2026-09-10 16:45:35.97131	Created Skill Rating 2 (Avg Cycle Time: 53s)
2043	OperatorPerformanceLog	314	Created	Admin	2026-09-10 16:45:35.983923	Created Performance Timing Test (25s · SUBMITTED)
2044	SkillAssessment	3231	Created	Admin	2026-09-10 16:45:35.991269	Created Skill Rating 5 (Avg Cycle Time: 25s)
2049	OperatorPerformanceLog	317	Created	Admin	2026-09-10 16:45:36.044761	Created Performance Timing Test (46s · SUBMITTED)
2050	SkillAssessment	3234	Created	Admin	2026-09-10 16:45:36.056868	Created Skill Rating 3 (Avg Cycle Time: 47s)
2063	OperatorPerformanceLog	324	Created	Admin	2026-09-10 16:45:36.200011	Created Performance Timing Test (71s · SUBMITTED)
2064	SkillAssessment	3241	Created	Admin	2026-09-10 16:45:36.208404	Created Skill Rating 1 (Avg Cycle Time: 71s)
2069	OperatorPerformanceLog	327	Created	Admin	2026-09-10 16:45:36.256837	Created Performance Timing Test (37s · SUBMITTED)
2070	SkillAssessment	3244	Created	Admin	2026-09-10 16:45:36.264536	Created Skill Rating 4 (Avg Cycle Time: 38s)
2083	OperatorPerformanceLog	334	Created	Admin	2026-09-10 16:45:36.371281	Created Performance Timing Test (26s · SUBMITTED)
2084	SkillAssessment	3251	Created	Admin	2026-09-10 16:45:36.377211	Created Skill Rating 5 (Avg Cycle Time: 26s)
2089	OperatorPerformanceLog	337	Created	Admin	2026-09-10 16:45:36.422399	Created Performance Timing Test (45s · SUBMITTED)
2090	SkillAssessment	3254	Created	Admin	2026-09-10 16:45:36.434052	Created Skill Rating 3 (Avg Cycle Time: 46s)
2103	OperatorPerformanceLog	344	Created	Admin	2026-09-10 16:45:36.553216	Created Performance Timing Test (80s · SUBMITTED)
2104	SkillAssessment	3261	Created	Admin	2026-09-10 16:45:36.562378	Created Skill Rating 1 (Avg Cycle Time: 80s)
2109	OperatorPerformanceLog	347	Created	Admin	2026-09-10 16:45:36.612149	Created Performance Timing Test (28s · SUBMITTED)
2110	SkillAssessment	3264	Created	Admin	2026-09-10 16:45:36.62386	Created Skill Rating 5 (Avg Cycle Time: 29s)
2123	OperatorPerformanceLog	354	Created	Admin	2026-09-10 16:45:36.733268	Created Performance Timing Test (36s · SUBMITTED)
2124	SkillAssessment	3271	Created	Admin	2026-09-10 16:45:36.74043	Created Skill Rating 3 (Avg Cycle Time: 36s)
2129	OperatorPerformanceLog	357	Created	Admin	2026-09-10 16:45:36.777594	Created Performance Timing Test (55s · SUBMITTED)
2130	SkillAssessment	3274	Created	Admin	2026-09-10 16:45:36.786929	Created Skill Rating 2 (Avg Cycle Time: 56s)
2143	OperatorPerformanceLog	364	Created	Admin	2026-09-10 16:45:36.884208	Created Performance Timing Test (40s · SUBMITTED)
2144	SkillAssessment	3281	Created	Admin	2026-09-10 16:45:36.890113	Created Skill Rating 5 (Avg Cycle Time: 40s)
2149	OperatorPerformanceLog	367	Created	Admin	2026-09-10 16:45:36.93005	Created Performance Timing Test (18s · SUBMITTED)
2150	SkillAssessment	3284	Created	Admin	2026-09-10 16:45:36.93669	Created Skill Rating 5 (Avg Cycle Time: 19s)
2163	OperatorPerformanceLog	374	Created	Admin	2026-09-10 16:45:37.033938	Created Performance Timing Test (31s · SUBMITTED)
2164	SkillAssessment	3291	Created	Admin	2026-09-10 16:45:37.042054	Created Skill Rating 5 (Avg Cycle Time: 31s)
2169	OperatorPerformanceLog	377	Created	Admin	2026-09-10 16:45:37.089879	Created Performance Timing Test (64s · SUBMITTED)
2170	SkillAssessment	3294	Created	Admin	2026-09-10 16:45:37.099015	Created Skill Rating 1 (Avg Cycle Time: 65s)
2183	OperatorPerformanceLog	384	Created	Admin	2026-09-10 16:45:37.199657	Created Performance Timing Test (39s · SUBMITTED)
2184	SkillAssessment	3301	Created	Admin	2026-09-10 16:45:37.208399	Created Skill Rating 4 (Avg Cycle Time: 39s)
2189	OperatorPerformanceLog	387	Created	Admin	2026-09-10 16:45:37.258107	Created Performance Timing Test (42s · SUBMITTED)
2190	SkillAssessment	3304	Created	Admin	2026-09-10 16:45:37.269204	Created Skill Rating 1 (Avg Cycle Time: 43s)
2203	OperatorPerformanceLog	394	Created	Admin	2026-09-10 16:45:37.375026	Created Performance Timing Test (26s · SUBMITTED)
2204	SkillAssessment	3311	Created	Admin	2026-09-10 16:45:37.385995	Created Skill Rating 5 (Avg Cycle Time: 26s)
2209	OperatorPerformanceLog	397	Created	Admin	2026-09-10 16:45:37.436514	Created Performance Timing Test (45s · SUBMITTED)
2210	SkillAssessment	3314	Created	Admin	2026-09-10 16:45:37.446488	Created Skill Rating 3 (Avg Cycle Time: 46s)
2223	OperatorPerformanceLog	404	Created	Admin	2026-09-10 16:45:37.574185	Created Performance Timing Test (70s · SUBMITTED)
2224	SkillAssessment	3321	Created	Admin	2026-09-10 16:45:37.583269	Created Skill Rating 1 (Avg Cycle Time: 70s)
2229	OperatorPerformanceLog	407	Created	Admin	2026-09-10 16:45:37.625636	Created Performance Timing Test (36s · SUBMITTED)
2230	SkillAssessment	3324	Created	Admin	2026-09-10 16:45:37.634727	Created Skill Rating 4 (Avg Cycle Time: 37s)
2243	OperatorPerformanceLog	414	Created	Admin	2026-09-10 16:45:37.752062	Created Performance Timing Test (22s · SUBMITTED)
2244	SkillAssessment	3331	Created	Admin	2026-09-10 16:45:37.760399	Created Skill Rating 5 (Avg Cycle Time: 22s)
1969	OperatorPerformanceLog	277	Created	Admin	2026-09-10 16:45:35.325153	Created Performance Timing Test (55s · SUBMITTED)
1970	SkillAssessment	3194	Created	Admin	2026-09-10 16:45:35.332153	Created Skill Rating 2 (Avg Cycle Time: 56s)
1971	OperatorPerformanceLog	278	Created	Admin	2026-09-10 16:45:35.336711	Created Performance Timing Test (31s · SUBMITTED)
1972	SkillAssessment	3195	Created	Admin	2026-09-10 16:45:35.342224	Created Skill Rating 5 (Avg Cycle Time: 31s)
1973	OperatorPerformanceLog	279	Created	Admin	2026-09-10 16:45:35.351282	Created Performance Timing Test (29s · SUBMITTED)
1974	SkillAssessment	3196	Created	Admin	2026-09-10 16:45:35.356814	Created Skill Rating 5 (Avg Cycle Time: 30s)
1975	OperatorPerformanceLog	280	Created	Admin	2026-09-10 16:45:35.364856	Created Performance Timing Test (81s · SUBMITTED)
1976	SkillAssessment	3197	Created	Admin	2026-09-10 16:45:35.371918	Created Skill Rating 1 (Avg Cycle Time: 81s)
1977	OperatorPerformanceLog	281	Created	Admin	2026-09-10 16:45:35.381996	Created Performance Timing Test (79s · SUBMITTED)
1978	SkillAssessment	3198	Created	Admin	2026-09-10 16:45:35.39567	Created Skill Rating 1 (Avg Cycle Time: 80s)
1979	OperatorPerformanceLog	282	Created	Admin	2026-09-10 16:45:35.405941	Created Performance Timing Test (25s · SUBMITTED)
1980	SkillAssessment	3199	Created	Admin	2026-09-10 16:45:35.411941	Created Skill Rating 5 (Avg Cycle Time: 25s)
1983	OperatorPerformanceLog	284	Created	Admin	2026-09-10 16:45:35.438369	Created Performance Timing Test (34s · SUBMITTED)
1984	SkillAssessment	3201	Created	Admin	2026-09-10 16:45:35.444173	Created Skill Rating 5 (Avg Cycle Time: 34s)
1989	OperatorPerformanceLog	287	Created	Admin	2026-09-10 16:45:35.479526	Created Performance Timing Test (20s · SUBMITTED)
1990	SkillAssessment	3204	Created	Admin	2026-09-10 16:45:35.487996	Created Skill Rating 5 (Avg Cycle Time: 21s)
1991	OperatorPerformanceLog	288	Created	Admin	2026-09-10 16:45:35.495071	Created Performance Timing Test (39s · SUBMITTED)
1992	SkillAssessment	3205	Created	Admin	2026-09-10 16:45:35.505892	Created Skill Rating 4 (Avg Cycle Time: 39s)
1993	OperatorPerformanceLog	289	Created	Admin	2026-09-10 16:45:35.512971	Created Performance Timing Test (37s · SUBMITTED)
1994	SkillAssessment	3206	Created	Admin	2026-09-10 16:45:35.522037	Created Skill Rating 4 (Avg Cycle Time: 38s)
1995	OperatorPerformanceLog	290	Created	Admin	2026-09-10 16:45:35.528082	Created Performance Timing Test (45s · SUBMITTED)
1996	SkillAssessment	3207	Created	Admin	2026-09-10 16:45:35.53668	Created Skill Rating 1 (Avg Cycle Time: 45s)
1997	OperatorPerformanceLog	291	Created	Admin	2026-09-10 16:45:35.542245	Created Performance Timing Test (43s · SUBMITTED)
1998	SkillAssessment	3208	Created	Admin	2026-09-10 16:45:35.55099	Created Skill Rating 1 (Avg Cycle Time: 44s)
1999	OperatorPerformanceLog	292	Created	Admin	2026-09-10 16:45:35.556289	Created Performance Timing Test (70s · SUBMITTED)
2000	SkillAssessment	3209	Created	Admin	2026-09-10 16:45:35.564971	Created Skill Rating 1 (Avg Cycle Time: 70s)
2003	OperatorPerformanceLog	294	Created	Admin	2026-09-10 16:45:35.590091	Created Performance Timing Test (39s · SUBMITTED)
2004	SkillAssessment	3211	Created	Admin	2026-09-10 16:45:35.598113	Created Skill Rating 3 (Avg Cycle Time: 39s)
2009	OperatorPerformanceLog	297	Created	Admin	2026-09-10 16:45:35.650203	Created Performance Timing Test (79s · SUBMITTED)
2010	SkillAssessment	3214	Created	Admin	2026-09-10 16:45:35.65647	Created Skill Rating 1 (Avg Cycle Time: 80s)
2011	OperatorPerformanceLog	298	Created	Admin	2026-09-10 16:45:35.668026	Created Performance Timing Test (31s · SUBMITTED)
2012	SkillAssessment	3215	Created	Admin	2026-09-10 16:45:35.674162	Created Skill Rating 4 (Avg Cycle Time: 31s)
2013	OperatorPerformanceLog	299	Created	Admin	2026-09-10 16:45:35.684891	Created Performance Timing Test (29s · SUBMITTED)
2014	SkillAssessment	3216	Created	Admin	2026-09-10 16:45:35.690686	Created Skill Rating 4 (Avg Cycle Time: 30s)
2015	OperatorPerformanceLog	300	Created	Admin	2026-09-10 16:45:35.700918	Created Performance Timing Test (40s · SUBMITTED)
2016	SkillAssessment	3217	Created	Admin	2026-09-10 16:45:35.707465	Created Skill Rating 5 (Avg Cycle Time: 40s)
2017	OperatorPerformanceLog	301	Created	Admin	2026-09-10 16:45:35.718057	Created Performance Timing Test (38s · SUBMITTED)
2018	SkillAssessment	3218	Created	Admin	2026-09-10 16:45:35.724199	Created Skill Rating 5 (Avg Cycle Time: 39s)
2019	OperatorPerformanceLog	302	Created	Admin	2026-09-10 16:45:35.732088	Created Performance Timing Test (23s · SUBMITTED)
2020	SkillAssessment	3219	Created	Admin	2026-09-10 16:45:35.739444	Created Skill Rating 5 (Avg Cycle Time: 23s)
2023	OperatorPerformanceLog	304	Created	Admin	2026-09-10 16:45:35.766247	Created Performance Timing Test (47s · SUBMITTED)
2024	SkillAssessment	3221	Created	Admin	2026-09-10 16:45:35.776283	Created Skill Rating 3 (Avg Cycle Time: 47s)
2029	OperatorPerformanceLog	307	Created	Admin	2026-09-10 16:45:35.826872	Created Performance Timing Test (33s · SUBMITTED)
2030	SkillAssessment	3224	Created	Admin	2026-09-10 16:45:35.839243	Created Skill Rating 3 (Avg Cycle Time: 34s)
2031	OperatorPerformanceLog	308	Created	Admin	2026-09-10 16:45:35.84709	Created Performance Timing Test (47s · SUBMITTED)
2032	SkillAssessment	3225	Created	Admin	2026-09-10 16:45:35.856884	Created Skill Rating 3 (Avg Cycle Time: 47s)
2033	OperatorPerformanceLog	309	Created	Admin	2026-09-10 16:45:35.8661	Created Performance Timing Test (45s · SUBMITTED)
2034	SkillAssessment	3226	Created	Admin	2026-09-10 16:45:35.874108	Created Skill Rating 3 (Avg Cycle Time: 46s)
2035	OperatorPerformanceLog	310	Created	Admin	2026-09-10 16:45:35.884084	Created Performance Timing Test (27s · SUBMITTED)
2036	SkillAssessment	3227	Created	Admin	2026-09-10 16:45:35.892345	Created Skill Rating 5 (Avg Cycle Time: 27s)
2037	OperatorPerformanceLog	311	Created	Admin	2026-09-10 16:45:35.905128	Created Performance Timing Test (25s · SUBMITTED)
2038	SkillAssessment	3228	Created	Admin	2026-09-10 16:45:35.924872	Created Skill Rating 5 (Avg Cycle Time: 26s)
2039	OperatorPerformanceLog	312	Created	Admin	2026-09-10 16:45:35.933959	Created Performance Timing Test (54s · SUBMITTED)
2040	SkillAssessment	3229	Created	Admin	2026-09-10 16:45:35.948109	Created Skill Rating 2 (Avg Cycle Time: 54s)
2045	OperatorPerformanceLog	315	Created	Admin	2026-09-10 16:45:36.003926	Created Performance Timing Test (23s · SUBMITTED)
2046	SkillAssessment	3232	Created	Admin	2026-09-10 16:45:36.013981	Created Skill Rating 5 (Avg Cycle Time: 24s)
2051	OperatorPerformanceLog	318	Created	Admin	2026-09-10 16:45:36.065449	Created Performance Timing Test (20s · SUBMITTED)
2052	SkillAssessment	3235	Created	Admin	2026-09-10 16:45:36.072977	Created Skill Rating 5 (Avg Cycle Time: 20s)
1985	OperatorPerformanceLog	285	Created	Admin	2026-09-10 16:45:35.455551	Created Performance Timing Test (32s · SUBMITTED)
1986	SkillAssessment	3202	Created	Admin	2026-09-10 16:45:35.46193	Created Skill Rating 5 (Avg Cycle Time: 33s)
2005	OperatorPerformanceLog	295	Created	Admin	2026-09-10 16:45:35.608762	Created Performance Timing Test (37s · SUBMITTED)
2006	SkillAssessment	3212	Created	Admin	2026-09-10 16:45:35.620039	Created Skill Rating 4 (Avg Cycle Time: 38s)
2025	OperatorPerformanceLog	305	Created	Admin	2026-09-10 16:45:35.787303	Created Performance Timing Test (45s · SUBMITTED)
2026	SkillAssessment	3222	Created	Admin	2026-09-10 16:45:35.799009	Created Skill Rating 3 (Avg Cycle Time: 46s)
2047	OperatorPerformanceLog	316	Created	Admin	2026-09-10 16:45:36.023029	Created Performance Timing Test (48s · SUBMITTED)
2048	SkillAssessment	3233	Created	Admin	2026-09-10 16:45:36.036697	Created Skill Rating 3 (Avg Cycle Time: 48s)
2067	OperatorPerformanceLog	326	Created	Admin	2026-09-10 16:45:36.236898	Created Performance Timing Test (39s · SUBMITTED)
2068	SkillAssessment	3243	Created	Admin	2026-09-10 16:45:36.248271	Created Skill Rating 3 (Avg Cycle Time: 39s)
2087	OperatorPerformanceLog	336	Created	Admin	2026-09-10 16:45:36.404403	Created Performance Timing Test (47s · SUBMITTED)
2088	SkillAssessment	3253	Created	Admin	2026-09-10 16:45:36.412269	Created Skill Rating 3 (Avg Cycle Time: 47s)
2107	OperatorPerformanceLog	346	Created	Admin	2026-09-10 16:45:36.593904	Created Performance Timing Test (30s · SUBMITTED)
2108	SkillAssessment	3263	Created	Admin	2026-09-10 16:45:36.603939	Created Skill Rating 4 (Avg Cycle Time: 30s)
2127	OperatorPerformanceLog	356	Created	Admin	2026-09-10 16:45:36.762918	Created Performance Timing Test (57s · SUBMITTED)
2128	SkillAssessment	3273	Created	Admin	2026-09-10 16:45:36.771648	Created Skill Rating 2 (Avg Cycle Time: 57s)
2147	OperatorPerformanceLog	366	Created	Admin	2026-09-10 16:45:36.914713	Created Performance Timing Test (20s · SUBMITTED)
2148	SkillAssessment	3283	Created	Admin	2026-09-10 16:45:36.924043	Created Skill Rating 5 (Avg Cycle Time: 20s)
2167	OperatorPerformanceLog	376	Created	Admin	2026-09-10 16:45:37.069228	Created Performance Timing Test (66s · SUBMITTED)
2168	SkillAssessment	3293	Created	Admin	2026-09-10 16:45:37.078235	Created Skill Rating 1 (Avg Cycle Time: 66s)
2187	OperatorPerformanceLog	386	Created	Admin	2026-09-10 16:45:37.240384	Created Performance Timing Test (44s · SUBMITTED)
2188	SkillAssessment	3303	Created	Admin	2026-09-10 16:45:37.250526	Created Skill Rating 1 (Avg Cycle Time: 44s)
2207	OperatorPerformanceLog	396	Created	Admin	2026-09-10 16:45:37.416625	Created Performance Timing Test (47s · SUBMITTED)
2208	SkillAssessment	3313	Created	Admin	2026-09-10 16:45:37.427002	Created Skill Rating 3 (Avg Cycle Time: 47s)
2227	OperatorPerformanceLog	406	Created	Admin	2026-09-10 16:45:37.607983	Created Performance Timing Test (38s · SUBMITTED)
2228	SkillAssessment	3323	Created	Admin	2026-09-10 16:45:37.619117	Created Skill Rating 4 (Avg Cycle Time: 38s)
2247	OperatorPerformanceLog	416	Created	Admin	2026-09-10 16:45:37.79021	Created Performance Timing Test (46s · SUBMITTED)
2248	SkillAssessment	3333	Created	Admin	2026-09-10 16:45:37.801184	Created Skill Rating 3 (Avg Cycle Time: 46s)
2053	OperatorPerformanceLog	319	Created	Admin	2026-09-10 16:45:36.080032	Created Performance Timing Test (18s · SUBMITTED)
2054	SkillAssessment	3236	Created	Admin	2026-09-10 16:45:36.08816	Created Skill Rating 5 (Avg Cycle Time: 19s)
2055	OperatorPerformanceLog	320	Created	Admin	2026-09-10 16:45:36.10491	Created Performance Timing Test (46s · SUBMITTED)
2056	SkillAssessment	3237	Created	Admin	2026-09-10 16:45:36.120345	Created Skill Rating 3 (Avg Cycle Time: 46s)
2057	OperatorPerformanceLog	321	Created	Admin	2026-09-10 16:45:36.136516	Created Performance Timing Test (44s · SUBMITTED)
2058	SkillAssessment	3238	Created	Admin	2026-09-10 16:45:36.152278	Created Skill Rating 3 (Avg Cycle Time: 45s)
2059	OperatorPerformanceLog	322	Created	Admin	2026-09-10 16:45:36.16025	Created Performance Timing Test (35s · SUBMITTED)
2060	SkillAssessment	3239	Created	Admin	2026-09-10 16:45:36.170339	Created Skill Rating 3 (Avg Cycle Time: 35s)
2061	OperatorPerformanceLog	323	Created	Admin	2026-09-10 16:45:36.182942	Created Performance Timing Test (33s · SUBMITTED)
2062	SkillAssessment	3240	Created	Admin	2026-09-10 16:45:36.189989	Created Skill Rating 3 (Avg Cycle Time: 34s)
2065	OperatorPerformanceLog	325	Created	Admin	2026-09-10 16:45:36.218234	Created Performance Timing Test (69s · SUBMITTED)
2066	SkillAssessment	3242	Created	Admin	2026-09-10 16:45:36.225777	Created Skill Rating 1 (Avg Cycle Time: 70s)
2071	OperatorPerformanceLog	328	Created	Admin	2026-09-10 16:45:36.271613	Created Performance Timing Test (65s · SUBMITTED)
2072	SkillAssessment	3245	Created	Admin	2026-09-10 16:45:36.277407	Created Skill Rating 1 (Avg Cycle Time: 65s)
2073	OperatorPerformanceLog	329	Created	Admin	2026-09-10 16:45:36.286795	Created Performance Timing Test (63s · SUBMITTED)
2074	SkillAssessment	3246	Created	Admin	2026-09-10 16:45:36.292064	Created Skill Rating 1 (Avg Cycle Time: 64s)
2075	OperatorPerformanceLog	330	Created	Admin	2026-09-10 16:45:36.303114	Created Performance Timing Test (30s · SUBMITTED)
2076	SkillAssessment	3247	Created	Admin	2026-09-10 16:45:36.309574	Created Skill Rating 4 (Avg Cycle Time: 30s)
2077	OperatorPerformanceLog	331	Created	Admin	2026-09-10 16:45:36.318871	Created Performance Timing Test (28s · SUBMITTED)
2078	SkillAssessment	3248	Created	Admin	2026-09-10 16:45:36.326493	Created Skill Rating 5 (Avg Cycle Time: 29s)
2079	OperatorPerformanceLog	332	Created	Admin	2026-09-10 16:45:36.336563	Created Performance Timing Test (41s · SUBMITTED)
2080	SkillAssessment	3249	Created	Admin	2026-09-10 16:45:36.346346	Created Skill Rating 5 (Avg Cycle Time: 41s)
2081	OperatorPerformanceLog	333	Created	Admin	2026-09-10 16:45:36.354976	Created Performance Timing Test (39s · SUBMITTED)
2082	SkillAssessment	3250	Created	Admin	2026-09-10 16:45:36.362501	Created Skill Rating 5 (Avg Cycle Time: 40s)
2085	OperatorPerformanceLog	335	Created	Admin	2026-09-10 16:45:36.388426	Created Performance Timing Test (24s · SUBMITTED)
2086	SkillAssessment	3252	Created	Admin	2026-09-10 16:45:36.394591	Created Skill Rating 5 (Avg Cycle Time: 25s)
2091	OperatorPerformanceLog	338	Created	Admin	2026-09-10 16:45:36.442197	Created Performance Timing Test (35s · SUBMITTED)
2092	SkillAssessment	3255	Created	Admin	2026-09-10 16:45:36.45233	Created Skill Rating 3 (Avg Cycle Time: 35s)
2093	OperatorPerformanceLog	339	Created	Admin	2026-09-10 16:45:36.460406	Created Performance Timing Test (33s · SUBMITTED)
2094	SkillAssessment	3256	Created	Admin	2026-09-10 16:45:36.470974	Created Skill Rating 3 (Avg Cycle Time: 34s)
2095	OperatorPerformanceLog	340	Created	Admin	2026-09-10 16:45:36.478208	Created Performance Timing Test (71s · SUBMITTED)
2096	SkillAssessment	3257	Created	Admin	2026-09-10 16:45:36.486627	Created Skill Rating 1 (Avg Cycle Time: 71s)
2097	OperatorPerformanceLog	341	Created	Admin	2026-09-10 16:45:36.494183	Created Performance Timing Test (69s · SUBMITTED)
2098	SkillAssessment	3258	Created	Admin	2026-09-10 16:45:36.504226	Created Skill Rating 1 (Avg Cycle Time: 70s)
2099	OperatorPerformanceLog	342	Created	Admin	2026-09-10 16:45:36.510891	Created Performance Timing Test (39s · SUBMITTED)
2100	SkillAssessment	3259	Created	Admin	2026-09-10 16:45:36.521229	Created Skill Rating 3 (Avg Cycle Time: 39s)
2101	OperatorPerformanceLog	343	Created	Admin	2026-09-10 16:45:36.530238	Created Performance Timing Test (37s · SUBMITTED)
2102	SkillAssessment	3260	Created	Admin	2026-09-10 16:45:36.54048	Created Skill Rating 4 (Avg Cycle Time: 38s)
2105	OperatorPerformanceLog	345	Created	Admin	2026-09-10 16:45:36.572995	Created Performance Timing Test (78s · SUBMITTED)
2106	SkillAssessment	3262	Created	Admin	2026-09-10 16:45:36.584844	Created Skill Rating 1 (Avg Cycle Time: 79s)
2111	OperatorPerformanceLog	348	Created	Admin	2026-09-10 16:45:36.635983	Created Performance Timing Test (40s · SUBMITTED)
2112	SkillAssessment	3265	Created	Admin	2026-09-10 16:45:36.64421	Created Skill Rating 5 (Avg Cycle Time: 40s)
2113	OperatorPerformanceLog	349	Created	Admin	2026-09-10 16:45:36.654853	Created Performance Timing Test (38s · SUBMITTED)
2114	SkillAssessment	3266	Created	Admin	2026-09-10 16:45:36.663852	Created Skill Rating 5 (Avg Cycle Time: 39s)
2115	OperatorPerformanceLog	350	Created	Admin	2026-09-10 16:45:36.670662	Created Performance Timing Test (27s · SUBMITTED)
2116	SkillAssessment	3267	Created	Admin	2026-09-10 16:45:36.676899	Created Skill Rating 5 (Avg Cycle Time: 27s)
2117	OperatorPerformanceLog	351	Created	Admin	2026-09-10 16:45:36.686877	Created Performance Timing Test (25s · SUBMITTED)
2118	SkillAssessment	3268	Created	Admin	2026-09-10 16:45:36.694121	Created Skill Rating 5 (Avg Cycle Time: 26s)
2119	OperatorPerformanceLog	352	Created	Admin	2026-09-10 16:45:36.703914	Created Performance Timing Test (47s · SUBMITTED)
2120	SkillAssessment	3269	Created	Admin	2026-09-10 16:45:36.710528	Created Skill Rating 3 (Avg Cycle Time: 47s)
2121	OperatorPerformanceLog	353	Created	Admin	2026-09-10 16:45:36.720012	Created Performance Timing Test (45s · SUBMITTED)
2122	SkillAssessment	3270	Created	Admin	2026-09-10 16:45:36.725755	Created Skill Rating 3 (Avg Cycle Time: 46s)
2125	OperatorPerformanceLog	355	Created	Admin	2026-09-10 16:45:36.750356	Created Performance Timing Test (34s · SUBMITTED)
2126	SkillAssessment	3272	Created	Admin	2026-09-10 16:45:36.754916	Created Skill Rating 3 (Avg Cycle Time: 35s)
2131	OperatorPerformanceLog	358	Created	Admin	2026-09-10 16:45:36.792096	Created Performance Timing Test (38s · SUBMITTED)
2132	SkillAssessment	3275	Created	Admin	2026-09-10 16:45:36.802435	Created Skill Rating 4 (Avg Cycle Time: 38s)
2133	OperatorPerformanceLog	359	Created	Admin	2026-09-10 16:45:36.809148	Created Performance Timing Test (36s · SUBMITTED)
2134	SkillAssessment	3276	Created	Admin	2026-09-10 16:45:36.818229	Created Skill Rating 4 (Avg Cycle Time: 37s)
2135	OperatorPerformanceLog	360	Created	Admin	2026-09-10 16:45:36.824792	Created Performance Timing Test (81s · SUBMITTED)
2136	SkillAssessment	3277	Created	Admin	2026-09-10 16:45:36.833876	Created Skill Rating 1 (Avg Cycle Time: 81s)
2137	OperatorPerformanceLog	361	Created	Admin	2026-09-10 16:45:36.840424	Created Performance Timing Test (79s · SUBMITTED)
2138	SkillAssessment	3278	Created	Admin	2026-09-10 16:45:36.850427	Created Skill Rating 1 (Avg Cycle Time: 80s)
2139	OperatorPerformanceLog	362	Created	Admin	2026-09-10 16:45:36.85663	Created Performance Timing Test (25s · SUBMITTED)
2140	SkillAssessment	3279	Created	Admin	2026-09-10 16:45:36.864686	Created Skill Rating 5 (Avg Cycle Time: 25s)
2141	OperatorPerformanceLog	363	Created	Admin	2026-09-10 16:45:36.871227	Created Performance Timing Test (23s · SUBMITTED)
2142	SkillAssessment	3280	Created	Admin	2026-09-10 16:45:36.876276	Created Skill Rating 5 (Avg Cycle Time: 24s)
2145	OperatorPerformanceLog	365	Created	Admin	2026-09-10 16:45:36.900694	Created Performance Timing Test (38s · SUBMITTED)
2146	SkillAssessment	3282	Created	Admin	2026-09-10 16:45:36.906939	Created Skill Rating 5 (Avg Cycle Time: 39s)
2151	OperatorPerformanceLog	368	Created	Admin	2026-09-10 16:45:36.941438	Created Performance Timing Test (47s · SUBMITTED)
2152	SkillAssessment	3285	Created	Admin	2026-09-10 16:45:36.948241	Created Skill Rating 3 (Avg Cycle Time: 47s)
2153	OperatorPerformanceLog	369	Created	Admin	2026-09-10 16:45:36.954098	Created Performance Timing Test (45s · SUBMITTED)
2154	SkillAssessment	3286	Created	Admin	2026-09-10 16:45:36.960123	Created Skill Rating 3 (Avg Cycle Time: 46s)
2155	OperatorPerformanceLog	370	Created	Admin	2026-09-10 16:45:36.966754	Created Performance Timing Test (35s · SUBMITTED)
2156	SkillAssessment	3287	Created	Admin	2026-09-10 16:45:36.972989	Created Skill Rating 3 (Avg Cycle Time: 35s)
2157	OperatorPerformanceLog	371	Created	Admin	2026-09-10 16:45:36.982674	Created Performance Timing Test (33s · SUBMITTED)
2158	SkillAssessment	3288	Created	Admin	2026-09-10 16:45:36.990206	Created Skill Rating 3 (Avg Cycle Time: 34s)
2159	OperatorPerformanceLog	372	Created	Admin	2026-09-10 16:45:36.999202	Created Performance Timing Test (57s · SUBMITTED)
2160	SkillAssessment	3289	Created	Admin	2026-09-10 16:45:37.006832	Created Skill Rating 2 (Avg Cycle Time: 57s)
2161	OperatorPerformanceLog	373	Created	Admin	2026-09-10 16:45:37.016468	Created Performance Timing Test (55s · SUBMITTED)
2162	SkillAssessment	3290	Created	Admin	2026-09-10 16:45:37.024663	Created Skill Rating 2 (Avg Cycle Time: 56s)
2165	OperatorPerformanceLog	375	Created	Admin	2026-09-10 16:45:37.052234	Created Performance Timing Test (29s · SUBMITTED)
2166	SkillAssessment	3292	Created	Admin	2026-09-10 16:45:37.059979	Created Skill Rating 5 (Avg Cycle Time: 30s)
2171	OperatorPerformanceLog	378	Created	Admin	2026-09-10 16:45:37.106056	Created Performance Timing Test (22s · SUBMITTED)
2172	SkillAssessment	3295	Created	Admin	2026-09-10 16:45:37.113954	Created Skill Rating 5 (Avg Cycle Time: 22s)
2173	OperatorPerformanceLog	379	Created	Admin	2026-09-10 16:45:37.12217	Created Performance Timing Test (20s · SUBMITTED)
2174	SkillAssessment	3296	Created	Admin	2026-09-10 16:45:37.129171	Created Skill Rating 5 (Avg Cycle Time: 21s)
2175	OperatorPerformanceLog	380	Created	Admin	2026-09-10 16:45:37.136279	Created Performance Timing Test (40s · SUBMITTED)
2176	SkillAssessment	3297	Created	Admin	2026-09-10 16:45:37.1423	Created Skill Rating 5 (Avg Cycle Time: 40s)
2177	OperatorPerformanceLog	381	Created	Admin	2026-09-10 16:45:37.152397	Created Performance Timing Test (38s · SUBMITTED)
2178	SkillAssessment	3298	Created	Admin	2026-09-10 16:45:37.159884	Created Skill Rating 5 (Avg Cycle Time: 39s)
2179	OperatorPerformanceLog	382	Created	Admin	2026-09-10 16:45:37.168925	Created Performance Timing Test (27s · SUBMITTED)
2180	SkillAssessment	3299	Created	Admin	2026-09-10 16:45:37.174691	Created Skill Rating 5 (Avg Cycle Time: 27s)
2181	OperatorPerformanceLog	383	Created	Admin	2026-09-10 16:45:37.183923	Created Performance Timing Test (25s · SUBMITTED)
2182	SkillAssessment	3300	Created	Admin	2026-09-10 16:45:37.190949	Created Skill Rating 5 (Avg Cycle Time: 26s)
2185	OperatorPerformanceLog	385	Created	Admin	2026-09-10 16:45:37.221158	Created Performance Timing Test (37s · SUBMITTED)
2186	SkillAssessment	3302	Created	Admin	2026-09-10 16:45:37.230262	Created Skill Rating 4 (Avg Cycle Time: 38s)
2191	OperatorPerformanceLog	388	Created	Admin	2026-09-10 16:45:37.276731	Created Performance Timing Test (70s · SUBMITTED)
2192	SkillAssessment	3305	Created	Admin	2026-09-10 16:45:37.288372	Created Skill Rating 1 (Avg Cycle Time: 70s)
2193	OperatorPerformanceLog	389	Created	Admin	2026-09-10 16:45:37.296925	Created Performance Timing Test (68s · SUBMITTED)
2194	SkillAssessment	3306	Created	Admin	2026-09-10 16:45:37.306568	Created Skill Rating 1 (Avg Cycle Time: 69s)
2195	OperatorPerformanceLog	390	Created	Admin	2026-09-10 16:45:37.314129	Created Performance Timing Test (39s · SUBMITTED)
2196	SkillAssessment	3307	Created	Admin	2026-09-10 16:45:37.321329	Created Skill Rating 3 (Avg Cycle Time: 39s)
2197	OperatorPerformanceLog	391	Created	Admin	2026-09-10 16:45:37.329157	Created Performance Timing Test (37s · SUBMITTED)
2198	SkillAssessment	3308	Created	Admin	2026-09-10 16:45:37.336984	Created Skill Rating 4 (Avg Cycle Time: 38s)
2199	OperatorPerformanceLog	392	Created	Admin	2026-09-10 16:45:37.346111	Created Performance Timing Test (64s · SUBMITTED)
2200	SkillAssessment	3309	Created	Admin	2026-09-10 16:45:37.354102	Created Skill Rating 1 (Avg Cycle Time: 64s)
2201	OperatorPerformanceLog	393	Created	Admin	2026-09-10 16:45:37.361933	Created Performance Timing Test (62s · SUBMITTED)
2202	SkillAssessment	3310	Created	Admin	2026-09-10 16:45:37.369322	Created Skill Rating 1 (Avg Cycle Time: 63s)
2205	OperatorPerformanceLog	395	Created	Admin	2026-09-10 16:45:37.396356	Created Performance Timing Test (24s · SUBMITTED)
2206	SkillAssessment	3312	Created	Admin	2026-09-10 16:45:37.407038	Created Skill Rating 5 (Avg Cycle Time: 25s)
2211	OperatorPerformanceLog	398	Created	Admin	2026-09-10 16:45:37.456655	Created Performance Timing Test (27s · SUBMITTED)
2212	SkillAssessment	3315	Created	Admin	2026-09-10 16:45:37.467992	Created Skill Rating 5 (Avg Cycle Time: 27s)
2213	OperatorPerformanceLog	399	Created	Admin	2026-09-10 16:45:37.478165	Created Performance Timing Test (25s · SUBMITTED)
2214	SkillAssessment	3316	Created	Admin	2026-09-10 16:45:37.489338	Created Skill Rating 5 (Avg Cycle Time: 26s)
2215	OperatorPerformanceLog	400	Created	Admin	2026-09-10 16:45:37.495984	Created Performance Timing Test (55s · SUBMITTED)
2216	SkillAssessment	3317	Created	Admin	2026-09-10 16:45:37.505421	Created Skill Rating 1 (Avg Cycle Time: 55s)
2217	OperatorPerformanceLog	401	Created	Admin	2026-09-10 16:45:37.516221	Created Performance Timing Test (53s · SUBMITTED)
2218	SkillAssessment	3318	Created	Admin	2026-09-10 16:45:37.524692	Created Skill Rating 2 (Avg Cycle Time: 54s)
2219	OperatorPerformanceLog	402	Created	Admin	2026-09-10 16:45:37.536939	Created Performance Timing Test (44s · SUBMITTED)
2220	SkillAssessment	3319	Created	Admin	2026-09-10 16:45:37.545592	Created Skill Rating 1 (Avg Cycle Time: 44s)
2221	OperatorPerformanceLog	403	Created	Admin	2026-09-10 16:45:37.555729	Created Performance Timing Test (42s · SUBMITTED)
2222	SkillAssessment	3320	Created	Admin	2026-09-10 16:45:37.566056	Created Skill Rating 1 (Avg Cycle Time: 43s)
2225	OperatorPerformanceLog	405	Created	Admin	2026-09-10 16:45:37.59029	Created Performance Timing Test (68s · SUBMITTED)
2226	SkillAssessment	3322	Created	Admin	2026-09-10 16:45:37.600355	Created Skill Rating 1 (Avg Cycle Time: 69s)
2231	OperatorPerformanceLog	408	Created	Admin	2026-09-10 16:45:37.641253	Created Performance Timing Test (80s · SUBMITTED)
2232	SkillAssessment	3325	Created	Admin	2026-09-10 16:45:37.650935	Created Skill Rating 1 (Avg Cycle Time: 80s)
2233	OperatorPerformanceLog	409	Created	Admin	2026-09-10 16:45:37.658483	Created Performance Timing Test (78s · SUBMITTED)
2234	SkillAssessment	3326	Created	Admin	2026-09-10 16:45:37.670058	Created Skill Rating 1 (Avg Cycle Time: 79s)
2235	OperatorPerformanceLog	410	Created	Admin	2026-09-10 16:45:37.67811	Created Performance Timing Test (21s · SUBMITTED)
2236	SkillAssessment	3327	Created	Admin	2026-09-10 16:45:37.688242	Created Skill Rating 5 (Avg Cycle Time: 21s)
2237	OperatorPerformanceLog	411	Created	Admin	2026-09-10 16:45:37.695388	Created Performance Timing Test (19s · SUBMITTED)
2238	SkillAssessment	3328	Created	Admin	2026-09-10 16:45:37.705208	Created Skill Rating 5 (Avg Cycle Time: 20s)
2239	OperatorPerformanceLog	412	Created	Admin	2026-09-10 16:45:37.715754	Created Performance Timing Test (34s · SUBMITTED)
2240	SkillAssessment	3329	Created	Admin	2026-09-10 16:45:37.724908	Created Skill Rating 5 (Avg Cycle Time: 34s)
2241	OperatorPerformanceLog	413	Created	Admin	2026-09-10 16:45:37.733006	Created Performance Timing Test (32s · SUBMITTED)
2242	SkillAssessment	3330	Created	Admin	2026-09-10 16:45:37.742113	Created Skill Rating 5 (Avg Cycle Time: 33s)
2245	OperatorPerformanceLog	415	Created	Admin	2026-09-10 16:45:37.771022	Created Performance Timing Test (20s · SUBMITTED)
2246	SkillAssessment	3332	Created	Admin	2026-09-10 16:45:37.78112	Created Skill Rating 5 (Avg Cycle Time: 21s)
2251	OperatorPerformanceLog	418	Created	Admin	2026-09-10 16:45:37.829496	Created Performance Timing Test (26s · SUBMITTED)
2252	SkillAssessment	3335	Created	Admin	2026-09-10 16:45:37.838148	Created Skill Rating 5 (Avg Cycle Time: 26s)
2253	OperatorPerformanceLog	419	Created	Admin	2026-09-10 16:45:37.850398	Created Performance Timing Test (24s · SUBMITTED)
2254	SkillAssessment	3336	Created	Admin	2026-09-10 16:45:37.859311	Created Skill Rating 5 (Avg Cycle Time: 25s)
2255	OperatorPerformanceLog	420	Created	Admin	2026-09-10 16:45:37.866806	Created Performance Timing Test (40s · SUBMITTED)
2256	SkillAssessment	3337	Created	Admin	2026-09-10 16:45:37.876166	Created Skill Rating 5 (Avg Cycle Time: 40s)
2257	OperatorPerformanceLog	421	Created	Admin	2026-09-10 16:45:37.888316	Created Performance Timing Test (38s · SUBMITTED)
2258	SkillAssessment	3338	Created	Admin	2026-09-10 16:45:37.898411	Created Skill Rating 5 (Avg Cycle Time: 39s)
2259	OperatorPerformanceLog	422	Created	Admin	2026-09-10 16:45:37.909137	Created Performance Timing Test (26s · SUBMITTED)
2260	SkillAssessment	3339	Created	Admin	2026-09-10 16:45:37.920377	Created Skill Rating 5 (Avg Cycle Time: 26s)
2261	OperatorPerformanceLog	423	Created	Admin	2026-09-10 16:45:37.934253	Created Performance Timing Test (24s · SUBMITTED)
2262	SkillAssessment	3340	Created	Admin	2026-09-10 16:45:37.943932	Created Skill Rating 5 (Avg Cycle Time: 25s)
2265	OperatorPerformanceLog	425	Created	Admin	2026-09-10 16:45:37.973212	Created Performance Timing Test (44s · SUBMITTED)
2266	SkillAssessment	3342	Created	Admin	2026-09-10 16:45:37.983273	Created Skill Rating 3 (Avg Cycle Time: 45s)
2249	OperatorPerformanceLog	417	Created	Admin	2026-09-10 16:45:37.810053	Created Performance Timing Test (44s · SUBMITTED)
2250	SkillAssessment	3334	Created	Admin	2026-09-10 16:45:37.821386	Created Skill Rating 3 (Avg Cycle Time: 45s)
2263	OperatorPerformanceLog	424	Created	Admin	2026-09-10 16:45:37.953912	Created Performance Timing Test (46s · SUBMITTED)
2264	SkillAssessment	3341	Created	Admin	2026-09-10 16:45:37.961258	Created Skill Rating 3 (Avg Cycle Time: 46s)
2274	OperationBulletin	10	Updated	Admin	2026-09-10 16:56:31.188939	Updated OperationBulletin #10
2275	OperationBulletin	10	Updated	Admin	2026-09-10 17:04:03.732463	Updated OperationBulletin #10
2276	OperationBulletin	10	Updated	Admin	2026-09-10 17:16:33.533155	Updated OperationBulletin #10
2277	Notification	45	Updated	Admin	2026-09-10 21:19:11.028484	Updated Notification #45
2278	PieceProductionLog	42	Deleted	Admin	2026-09-10 22:04:18.355362	Deleted PieceProductionLog #42
2279	PieceProductionLog	43	Deleted	Admin	2026-09-10 22:05:29.646736	Deleted PieceProductionLog #43
2280	PieceProductionLog	44	Deleted	Admin	2026-09-10 22:05:38.01942	Deleted PieceProductionLog #44
2281	PieceProductionLog	41	Deleted	Admin	2026-09-10 22:05:46.246598	Deleted PieceProductionLog #41
2282	PieceProductionLog	40	Deleted	Admin	2026-09-10 22:05:55.826354	Deleted PieceProductionLog #40
2283	PieceProductionLog	39	Deleted	Admin	2026-09-10 22:06:03.987955	Deleted PieceProductionLog #39
2284	PieceProductionLog	45	Created	Admin	2026-09-10 22:06:33.182518	Created PieceProductionLog #45
2285	PieceProductionLog	46	Created	Admin	2026-09-10 22:07:15.378462	Created PieceProductionLog #46
2286	PieceProductionLog	47	Created	Admin	2026-09-10 22:08:03.285233	Created PieceProductionLog #47
2287	PieceProductionLog	48	Created	Admin	2026-09-10 22:09:01.816362	Created PieceProductionLog #48
2288	PieceProductionLog	49	Created	Admin	2026-09-10 22:09:49.073047	Created PieceProductionLog #49
2289	PieceProductionLog	50	Created	Admin	2026-09-10 22:10:12.847099	Created PieceProductionLog #50
2290	Notification	45	Updated	Admin	2026-09-11 09:58:36.778771	Updated Notification #45
2291	Notification	45	Updated	Admin	2026-09-11 09:58:43.034915	Updated Notification #45
2292	PieceProductionLog	51	Created	Admin	2026-09-11 09:59:42.536335	Created PieceProductionLog #51
2293	PieceProductionLog	52	Created	Admin	2026-09-11 09:59:59.455836	Created PieceProductionLog #52
2294	PieceProductionLog	53	Created	Admin	2026-09-11 10:00:38.496272	Created PieceProductionLog #53
2295	PieceProductionLog	54	Created	Admin	2026-09-11 10:00:55.476864	Created PieceProductionLog #54
2296	PieceProductionLog	55	Created	Admin	2026-09-11 10:01:13.665806	Created PieceProductionLog #55
2298	LinePlanAssignment	20	Deleted	Admin	2026-09-11 10:13:13.703637	Deleted LinePlanAssignment #20
2299	LinePlanAssignment	21	Deleted	Admin	2026-09-11 10:13:13.705651	Deleted LinePlanAssignment #21
2300	LinePlanAssignment	22	Deleted	Admin	2026-09-11 10:13:13.707636	Deleted LinePlanAssignment #22
2301	LinePlan	4	Updated	Admin	2026-09-11 10:13:13.727768	Updated LinePlan #4
2302	PieceProductionLog	56	Created	Admin	2026-09-11 10:14:25.31273	Created PieceProductionLog #56
2303	Notification	45	Updated	Admin	2026-09-11 10:14:44.048525	Updated Notification #45
2304	Notification	45	Updated	Admin	2026-09-11 10:15:39.489302	Updated Notification #45
2307	Notification	45	Updated	Admin	2026-09-11 11:27:27.112964	Updated Notification #45
2309	Notification	45	Updated	Admin	2026-09-11 12:11:37.231411	Updated Notification #45
2312	PieceProductionLog	57	Created	Admin	2026-09-11 13:06:25.709433	Created PieceProductionLog #57
2313	PieceProductionLog	58	Created	Admin	2026-09-11 13:07:22.198654	Created PieceProductionLog #58
2314	PieceProductionLog	57	Updated	Admin	2026-09-11 13:08:06.582593	Updated PieceProductionLog #57
2315	PieceProductionLog	59	Created	Admin	2026-09-11 13:09:20.190353	Created PieceProductionLog #59
2316	PieceProductionLog	60	Created	Admin	2026-09-11 13:09:58.486134	Created PieceProductionLog #60
2317	PieceProductionLog	61	Created	Admin	2026-09-11 13:11:17.087748	Created PieceProductionLog #61
2318	PieceProductionLog	62	Created	Admin	2026-09-11 13:12:02.10436	Created PieceProductionLog #62
2319	Notification	45	Updated	Admin	2026-09-11 14:36:23.456925	Updated Notification #45
2320	Notification	45	Updated	Admin	2026-09-11 14:44:35.334589	Updated Notification #45
2321	PieceProductionLog	60	Updated	Admin	2026-09-11 15:15:31.101604	Updated PieceProductionLog #60
2322	PieceProductionLog	61	Updated	Admin	2026-09-11 15:15:47.446037	Updated PieceProductionLog #61
2323	PieceProductionLog	62	Updated	Admin	2026-09-11 15:16:08.207119	Updated PieceProductionLog #62
2324	PieceProductionLog	59	Updated	Admin	2026-09-11 15:16:25.728476	Updated PieceProductionLog #59
2325	PieceProductionLog	57	Updated	Admin	2026-09-11 15:16:40.931101	Updated PieceProductionLog #57
2326	PieceProductionLog	58	Updated	Admin	2026-09-11 15:17:00.011767	Updated PieceProductionLog #58
2327	Notification	43	Updated	Admin	2026-09-11 17:11:23.176393	Updated Notification #43
2328	Notification	43	Updated	Admin	2026-09-11 17:11:23.236454	Updated Notification #43
2329	Notification	45	Updated	Admin	2026-09-11 17:12:26.368894	Updated Notification #45
2330	Notification	45	Updated	Admin	2026-09-12 09:45:24.606619	Updated Notification #45
2331	Notification	45	Updated	Admin	2026-09-12 09:53:25.032265	Updated Notification #45
2332	Notification	45	Updated	Admin	2026-09-12 09:56:57.108767	Updated Notification #45
2333	Notification	43	Updated	Admin	2026-09-12 10:20:15.741624	Updated Notification #43
2334	Notification	43	Updated	Admin	2026-09-12 10:20:15.857268	Updated Notification #43
2337	Notification	45	Updated	Admin	2026-09-12 10:20:36.084848	Updated Notification #45
2338	Notification	45	Updated	Admin	2026-09-12 10:20:36.175573	Updated Notification #45
2339	Notification	45	Updated	Admin	2026-09-12 11:29:37.611327	Updated Notification #45
2340	Notification	45	Updated	Admin	2026-09-12 11:35:27.254581	Updated Notification #45
2342	LinePlanAssignment	33	Created	Admin	2026-09-12 11:44:06.740478	Created LinePlanAssignment #33
2343	LinePlanAssignment	34	Created	Admin	2026-09-12 11:44:06.743325	Created LinePlanAssignment #34
2344	LinePlanAssignment	35	Created	Admin	2026-09-12 11:44:06.744838	Created LinePlanAssignment #35
2345	LinePlanAssignment	36	Created	Admin	2026-09-12 11:44:06.746346	Created LinePlanAssignment #36
2346	Order	17	Created	Admin	2026-09-12 12:09:42.580446	Created Order PO-2026-004 (Buyer: Teamspirit · Qty: 2000 pcs · Status: PLANNED)
2347	Order	17	Updated	Admin	2026-09-12 12:10:17.814235	Updated Order PO-2026-004 (Buyer: Teamspirit · Qty: 20000 pcs · Status: PLANNED)
2348	OperationBulletin	11	Created	Admin	2026-09-12 12:12:15.673664	Created OperationBulletin #11
2349	OperationBulletin	11	Updated	Admin	2026-09-12 12:12:21.504034	Updated OperationBulletin #11
2350	Notification	46	Created	Admin	2026-09-12 12:14:39.39168	Created Notification #46
2352	OperationBulletin	11	Updated	Admin	2026-09-12 12:40:52.165726	Updated OperationBulletin #11
2354	Notification	46	Updated	Admin	2026-09-12 12:47:44.550835	Updated Notification #46
2355	Order	17	Updated	Admin	2026-09-12 12:48:23.506388	Updated Order PO-2026-004 (Buyer: Teamspirit · Qty: 12000 pcs · Status: PLANNED)
2356	Notification	46	Updated	Admin	2026-09-12 12:50:34.174725	Updated Notification #46
2359	CapacityPlan	6	Deleted	Admin	2026-09-12 12:59:20.460222	Deleted CapacityPlan #6
2360	LineDesign	1	Updated	Admin	2026-09-12 13:01:05.459213	Updated LineDesign #1
2361	CapacityPlan	1	Deleted	Admin	2026-09-12 13:01:05.470126	Deleted CapacityPlan #1
2363	LineDesign	4	Updated	Admin	2026-09-12 13:01:10.14744	Updated LineDesign #4
2364	CapacityPlan	3	Deleted	Admin	2026-09-12 13:01:10.149257	Deleted CapacityPlan #3
2365	CapacityPlan	4	Deleted	Admin	2026-09-12 13:01:13.870694	Deleted CapacityPlan #4
2367	CapacityPlan	7	Created	Admin	2026-09-12 13:05:19.929017	Created CapacityPlan #7
2362	CapacityPlan	2	Deleted	Admin	2026-09-12 13:01:07.762226	Deleted CapacityPlan #2
2366	CapacityPlan	5	Deleted	Admin	2026-09-12 13:03:05.742393	Deleted CapacityPlan #5
2368	Notification	46	Updated	Admin	2026-09-12 13:22:23.581773	Updated Notification #46
2369	LineDesign	5	Created	Admin	2026-09-12 13:24:01.269285	Created LineDesign #5
2370	LineDesign	6	Created	Admin	2026-09-12 13:39:01.601409	Created LineDesign #6
2371	LineDesign	7	Created	Admin	2026-09-12 13:39:58.982812	Created LineDesign #7
2372	LineDesign	8	Created	Admin	2026-09-12 13:52:33.934254	Created LineDesign #8
2373	LineDesign	9	Created	Admin	2026-09-12 13:52:42.897363	Created LineDesign #9
2374	LineDesign	9	Updated	Admin	2026-09-12 13:53:30.172842	Updated LineDesign #9
2375	LineDesign	9	Deleted	Admin	2026-09-12 13:53:48.646369	Deleted LineDesign #9
2376	LineDesign	10	Created	Admin	2026-09-12 13:53:52.971718	Created LineDesign #10
2377	LineDesign	10	Updated	Admin	2026-09-12 13:53:52.98649	Updated LineDesign #10
2378	LineDesign	10	Deleted	Admin	2026-09-12 13:53:52.993787	Deleted LineDesign #10
2379	LineDesign	11	Created	Admin	2026-09-12 13:54:03.375882	Created LineDesign #11
2380	LineDesign	11	Updated	Admin	2026-09-12 13:54:03.388984	Updated LineDesign #11
2381	LineDesign	11	Deleted	Admin	2026-09-12 13:54:03.396412	Deleted LineDesign #11
2382	Notification	46	Updated	Admin	2026-09-12 14:58:53.494318	Updated Notification #46
2383	LineDesign	1	Deleted	Admin	2026-09-12 15:01:00.39284	Deleted LineDesign #1
2384	LineDesign	4	Deleted	Admin	2026-09-12 15:01:02.596065	Deleted LineDesign #4
2385	LineDesign	5	Deleted	Admin	2026-09-12 15:01:04.910895	Deleted LineDesign #5
2386	LineDesign	6	Deleted	Admin	2026-09-12 15:01:28.337927	Deleted LineDesign #6
2387	LineDesign	7	Deleted	Admin	2026-09-12 15:01:30.613827	Deleted LineDesign #7
2388	LineDesign	8	Deleted	Admin	2026-09-12 15:01:35.49238	Deleted LineDesign #8
2389	LineDesign	12	Created	Admin	2026-09-12 15:02:55.412414	Created LineDesign #12
2390	LinePlanAssignment	37	Created	Admin	2026-09-12 15:23:16.862587	Created LinePlanAssignment #37
2391	LinePlan	5	Updated	Admin	2026-09-12 15:23:16.874567	Updated LinePlan #5
2392	LinePlanAssignment	25	Deleted	Admin	2026-09-12 15:23:16.878568	Deleted LinePlanAssignment #25
2393	LinePlanAssignment	26	Deleted	Admin	2026-09-12 15:23:16.879567	Deleted LinePlanAssignment #26
2394	LinePlanAssignment	27	Deleted	Admin	2026-09-12 15:23:16.881569	Deleted LinePlanAssignment #27
2395	LinePlanAssignment	28	Deleted	Admin	2026-09-12 15:23:16.882569	Deleted LinePlanAssignment #28
2396	LinePlanAssignment	29	Deleted	Admin	2026-09-12 15:23:16.884567	Deleted LinePlanAssignment #29
2397	LinePlanAssignment	30	Deleted	Admin	2026-09-12 15:23:16.886567	Deleted LinePlanAssignment #30
2398	LinePlanAssignment	31	Deleted	Admin	2026-09-12 15:23:16.887568	Deleted LinePlanAssignment #31
2399	LinePlanAssignment	32	Deleted	Admin	2026-09-12 15:23:16.88957	Deleted LinePlanAssignment #32
2400	LinePlanAssignment	38	Created	Admin	2026-09-12 15:25:47.70531	Created LinePlanAssignment #38
2401	LinePlanAssignment	37	Deleted	Admin	2026-09-12 15:25:47.712006	Deleted LinePlanAssignment #37
2402	LinePlan	7	Created	Admin	2026-09-12 15:28:13.090907	Created LinePlan #7
2403	LinePlanAssignment	39	Created	Admin	2026-09-12 15:28:13.095913	Created LinePlanAssignment #39
2404	LinePlanAssignment	40	Created	Admin	2026-09-12 15:28:13.10298	Created LinePlanAssignment #40
2405	LinePlanAssignment	41	Created	Admin	2026-09-12 15:28:13.106978	Created LinePlanAssignment #41
2406	LinePlanAssignment	42	Created	Admin	2026-09-12 15:28:13.106978	Created LinePlanAssignment #42
2407	LinePlanAssignment	43	Created	Admin	2026-09-12 15:28:13.117741	Created LinePlanAssignment #43
2408	LinePlanAssignment	44	Created	Admin	2026-09-12 15:28:13.117741	Created LinePlanAssignment #44
2409	LinePlanAssignment	45	Created	Admin	2026-09-12 15:28:13.117741	Created LinePlanAssignment #45
2410	LinePlanAssignment	46	Created	Admin	2026-09-12 15:28:13.132975	Created LinePlanAssignment #46
2411	LinePlanAssignment	47	Created	Admin	2026-09-12 15:28:13.134603	Created LinePlanAssignment #47
2412	LinePlanAssignment	48	Created	Admin	2026-09-12 15:28:13.134603	Created LinePlanAssignment #48
2413	LineDesign	12	Updated	Admin	2026-09-12 15:28:13.236578	Updated LineDesign #12
2414	PieceProductionLog	63	Created	Admin	2026-09-12 15:47:43.750709	Created PieceProductionLog #63
2415	PieceProductionLog	64	Created	Admin	2026-09-12 15:48:03.810311	Created PieceProductionLog #64
2416	PieceProductionLog	65	Created	Admin	2026-09-12 15:48:20.646254	Created PieceProductionLog #65
2417	PieceProductionLog	64	Updated	Admin	2026-09-12 15:49:19.746726	Updated PieceProductionLog #64
2418	PieceProductionLog	66	Created	Admin	2026-09-12 15:49:48.071313	Created PieceProductionLog #66
2419	PieceProductionLog	67	Created	Admin	2026-09-12 15:50:05.3337	Created PieceProductionLog #67
2420	PieceProductionLog	68	Created	Admin	2026-09-12 15:50:19.531453	Created PieceProductionLog #68
2421	PieceProductionLog	69	Created	Admin	2026-09-12 15:50:29.992038	Created PieceProductionLog #69
2422	PieceProductionLog	70	Created	Admin	2026-09-12 15:50:42.313676	Created PieceProductionLog #70
2423	Notification	47	Created	Admin	2026-09-12 16:35:02.181893	Created Notification #47
2424	OperationBulletin	12	Created	Admin	2026-09-12 16:35:25.82804	Created OperationBulletin #12
2425	OperationBulletin	12	Deleted	Admin	2026-09-12 16:35:25.871862	Deleted OperationBulletin #12
2426	OperationBulletin	13	Created	Admin	2026-09-12 16:38:14.098694	Created OperationBulletin #13
2427	Notification	47	Updated	Admin	2026-09-12 16:38:14.158942	Updated Notification #47
2428	OperationBulletin	13	Deleted	Admin	2026-09-12 16:38:14.250976	Deleted OperationBulletin #13
\.


--
-- Data for Name: balance_station_operations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_station_operations (id, balance_workstation_id, operation_id, bulletin_line_id, sequence, operation_smv, machine_type, is_split, split_ratio, is_qc_checkpoint) FROM stdin;
\.


--
-- Data for Name: balance_workstations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_workstations (id, line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bulletin_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bulletin_lines (id, bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes, is_qc_checkpoint, section, predecessor_ids, is_parallelizable, split_allowed, split_type, stitch_type, seam_type, attachment_type, wip_threshold) FROM stdin;
7	3	1	1	0.4000	Overlock 4-Thread	3	Capacity: 150 pcs/hr (1 op)	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
8	3	2	4	0.7500	Overlock 4-Thread	4	Capacity: 80 pcs/hr (1 op)	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
9	3	3	6	0.5000	Overlock 4-Thread	3	Capacity: 120 pcs/hr (1 op)	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
10	3	4	7	1.2000	Flatlock / Coverstitch	4	BOTTLENECK: 50 pcs/hr with 1 op. Requires 2 ops for 100 pcs/hr!	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
11	3	5	2	0.6500	Flatlock Cylindrical	4	Capacity: 92 pcs/hr (1 op)	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
26	7	1	1	0.4000	4-Thread Overlock	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
27	7	2	2	0.6500	4-Thread Overlock	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
28	7	3	3	0.3500	Single Needle Lockstitch	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
29	7	4	9	0.3500	Single Needle Lockstitch	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
35	8	1	3	0.8500	Single Needle Lockstitch	4	Prep collar point with fusing	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
36	8	2	5	0.9500	Single Needle Lockstitch	5	Crucial symmetry on front box placket	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
37	8	3	1	0.4500	Overlock 4-Thread	3	Reinforced mobilon tape on shoulder seam	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
38	8	4	4	0.8000	Overlock 4-Thread	4	Match notches on armhole sleeve join	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
39	8	5	7	1.2000	Flatlock / Coverstitch	4	Side vent finish & bottom double stitch hem	f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
44	10	2	2	0.6500	4-Thread Overlock	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
45	10	3	3	0.3500	Single Needle Lockstitch	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
46	10	4	4	0.7500	4-Thread Overlock	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
47	10	5	5	0.4200	4-Thread Overlock	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
48	10	6	6	0.5000	4-Thread Overlock	3		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
43	10	1	1	0.4000	4-Thread Overlock	5		f	MAIN_ASSEMBLY	\N	t	f	NONE	\N	\N	\N	20
49	11	1	1	0.4000	4-Thread Overlock	3		f	MAIN_ASSEMBLY		f	t	RATIO				20
50	11	2	4	0.7500	4-Thread Overlock	3		f	MAIN_ASSEMBLY		f	t	RATIO				20
51	11	3	5	0.4200	4-Thread Overlock	5		f	MAIN_ASSEMBLY		f	t	RATIO				20
52	11	4	6	0.5000	4-Thread Overlock	4		f	MAIN_ASSEMBLY		f	t	RATIO				20
53	11	5	7	1.2000	Flatlock / Interlock	4		f	MAIN_ASSEMBLY		f	t	RATIO				20
54	11	6	10	0.3500	Manual / Trim Station	5		f	MAIN_ASSEMBLY		f	t	RATIO				20
55	11	7	11	0.3500	Manual / Trim Station	5		f	MAIN_ASSEMBLY		f	t	RATIO				20
56	11	8	12	0.3500	Inspection Table	5		f	MAIN_ASSEMBLY		f	t	RATIO				20
\.


--
-- Data for Name: bulletin_styles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bulletin_styles (bulletin_id, style_id) FROM stdin;
3	5
7	2
8	18
10	21
11	19
\.


--
-- Data for Name: capacity_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.capacity_plans (id, plan_code, order_id, style_id, bulletin_id, shift_id, order_quantity, available_days, target_hourly_output, planned_efficiency, allowance_pfd, total_smv_minutes, customer_takt_secs, required_design_capacity, designed_pitch_secs, theoretical_manpower, planned_manpower, status, created_at, updated_at) FROM stdin;
7	CAP-PO-2026-004-9921	17	19	11	1	12000	21	81	85	5,4,1	4.32	44.44	95.29	37.78	5.8	6.9	ACTIVE	2026-09-12 13:05:19.921659	2026-09-12 13:05:19.921659
\.


--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_conversations (id, user_identifier, title, context_metadata, created_at, updated_at) FROM stdin;
73	default_user	What styles do we have in the system?	\N	2026-09-12 10:29:55.490309	2026-09-12 10:29:55.525186
3	admin_ie	What is the SMV of Back Pocket Attach?	\N	2026-09-11 16:22:21.670614	2026-09-11 16:22:21.746537
74	default_user	How many orders are currently active?	\N	2026-09-12 10:29:55.531961	2026-09-12 10:29:55.540957
4	admin_ie	Which operation is the bottleneck on Lin...	\N	2026-09-11 16:22:43.834945	2026-09-11 16:22:43.853578
75	default_user	What is the status of Line 01?	\N	2026-09-12 10:29:55.545369	2026-09-12 10:29:55.552245
7	admin_ie	hello	\N	2026-09-11 16:43:48.338954	2026-09-11 16:43:48.369717
76	default_user	Show me today's production for Line 01	\N	2026-09-12 10:29:55.557252	2026-09-12 10:29:55.571499
77	default_user	What is the bottleneck station on Line 0...	\N	2026-09-12 10:29:55.576498	2026-09-12 10:29:55.584504
78	default_user	Who are the operators assigned to Line 0...	\N	2026-09-12 10:29:55.588234	2026-09-12 10:29:55.603694
79	default_user	What is the SMV of Bottom Hem?	\N	2026-09-12 10:29:55.608179	2026-09-12 10:29:55.614179
80	default_user	Which machine is used for Neck Rib Attac...	\N	2026-09-12 10:29:55.617204	2026-09-12 10:29:55.620178
10	test_user	What is the SMV of Bottom Hem?	\N	2026-09-11 17:21:40.36106	2026-09-11 17:21:40.370308
81	default_user	What is the takt time for Line 01?	\N	2026-09-12 10:29:55.624151	2026-09-12 10:29:55.634159
11	test_user	What is the SMV of Shoulder Join?	\N	2026-09-11 17:21:40.413668	2026-09-11 17:21:40.418537
12	test_user	Which operation is the bottleneck on Lin...	\N	2026-09-11 17:21:40.42518	2026-09-11 17:21:40.431392
82	default_user	Who is absent today?	\N	2026-09-12 10:29:55.637318	2026-09-12 10:29:55.652325
13	test_user	How many operators are on Line 01?	\N	2026-09-11 17:21:40.436718	2026-09-11 17:21:40.441068
14	test_user	Show all operations	\N	2026-09-11 17:21:40.44719	2026-09-11 17:21:40.450745
83	default_user	How many single needle machines do we ha...	\N	2026-09-12 10:29:55.655357	2026-09-12 10:29:55.658323
84	default_user	Compare Line 01 and Line 02	\N	2026-09-12 10:29:55.661324	2026-09-12 10:29:55.665774
17	test_user	What is the SMV of Bottom Hem?	\N	2026-09-11 17:29:32.877074	2026-09-11 17:29:32.940683
18	test_user	What is the SMV of Shoulder Join?	\N	2026-09-11 17:29:32.990555	2026-09-11 17:29:32.998237
85	default_user	What is the Line Balancing Efficiency of...	\N	2026-09-12 10:29:55.668112	2026-09-12 10:29:55.674121
19	test_user	Which operation is the bottleneck on Lin...	\N	2026-09-11 17:29:33.007571	2026-09-11 17:29:33.029145
20	test_user	How many operators are on Line 01?	\N	2026-09-11 17:29:33.040166	2026-09-11 17:29:33.054872
86	default_user	Explain how Takt Time is calculated	\N	2026-09-12 10:29:55.678174	2026-09-12 10:29:55.683187
21	test_user	Show all operations	\N	2026-09-11 17:29:33.067976	2026-09-11 17:29:33.118418
22	test_user	What is the Line Balancing Efficiency of...	\N	2026-09-11 17:29:33.132789	2026-09-11 17:29:33.148237
87	default_user	Who is the buyer for PO-2026-001?	\N	2026-09-12 10:29:55.686178	2026-09-12 10:29:55.691352
23	test_user	What is today's production for Line 01?	\N	2026-09-11 17:29:33.158353	2026-09-11 17:29:33.174054
88	default_user	What operations are in style STY-POLO-80...	\N	2026-09-12 10:29:55.696716	2026-09-12 10:29:55.703694
89	default_user	What recommendations do you have to opti...	\N	2026-09-12 10:29:55.707265	2026-09-12 10:29:55.716669
27	test_user	what is total quantity ordered by netpla...	\N	2026-09-11 17:41:07.623995	2026-09-11 17:41:07.65732
90	default_user	How many pieces did Line 01 produce this...	\N	2026-09-12 10:29:55.71968	2026-09-12 10:29:55.72712
28	test_user	what is total quantity ordered by Zara M...	\N	2026-09-11 17:41:15.168027	2026-09-11 17:41:15.179529
29	test_user	how many garments ordered by Levi Straus...	\N	2026-09-11 17:41:15.204489	2026-09-11 17:41:15.212485
91	default_user	Tell me about operator Ramu	\N	2026-09-12 10:29:55.73012	2026-09-12 10:29:55.73312
30	test_user	what is the total order quantity across ...	\N	2026-09-11 17:41:15.222532	2026-09-11 17:41:15.246153
31	test_user	status of order PO-2026-003	\N	2026-09-11 17:41:15.257963	2026-09-11 17:41:15.281861
92	default_user	Which operator has the highest skill rat...	\N	2026-09-12 10:29:55.735128	2026-09-12 10:29:55.739138
32	test_user	what is the total quantity ordered by Ad...	\N	2026-09-11 17:41:15.291858	2026-09-11 17:41:15.313476
95	default_user	what is skill rating	{"styleId":null,"styleCode":null,"lineId":null,"lineCode":null,"orderId":null,"orderCode":null,"shiftId":null,"lineDesignId":null,"page":"Factory Executive Cockpit"}	2026-09-12 10:52:57.930423	2026-09-12 10:54:46.503359
96	test_user	What is the takt time for order 1?	\N	2026-09-12 11:44:06.848807	2026-09-12 11:44:32.983096
97	test_user	What is the takt time for order 1?	\N	2026-09-12 11:47:54.236032	2026-09-12 11:47:58.084169
69	default_user	what is the total smv of Uniqlo LifeWear...	{"styleId":null,"styleCode":null,"lineId":null,"lineCode":null,"orderId":null,"orderCode":null,"shiftId":null,"lineDesignId":null,"page":"Operation Bulletins"}	2026-09-12 09:58:24.30534	2026-09-12 10:00:57.073478
100	test_user	What is the takt time for order 1?	\N	2026-09-12 12:31:20.38517	2026-09-12 12:31:22.614861
101	default_user	how is customer takt time calculated	\N	2026-09-12 12:32:38.860479	2026-09-12 12:32:41.538676
71	default_user	What is the target for Line 01?	\N	2026-09-12 10:18:29.895119	2026-09-12 10:18:29.900391
102	default_user	how is customer takt time calculated	\N	2026-09-12 12:33:22.873974	2026-09-12 12:33:25.789556
72	default_user	Explain why line 1 has 22 operators in a...	\N	2026-09-12 10:18:35.696548	2026-09-12 10:18:35.703302
103	default_user	how is customer takt time calculated	\N	2026-09-12 12:33:42.371298	2026-09-12 12:33:45.175008
70	default_user	How many operators are assigned to Line ...	{"styleId":null,"styleCode":null,"lineId":null,"lineCode":null,"orderId":null,"orderCode":null,"shiftId":null,"lineDesignId":null,"page":"Plant Management Dashboard"}	2026-09-12 10:16:34.302965	2026-09-12 10:19:57.299096
106	default_user	Which operation is the bottleneck on Lin...	{"styleId":null,"styleCode":null,"lineId":null,"lineCode":null,"orderId":null,"orderCode":null,"shiftId":null,"lineDesignId":null,"page":"Line Balancing Suite"}	2026-09-12 16:14:52.787581	2026-09-12 16:14:56.894318
\.


--
-- Data for Name: chat_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_feedback (id, message_id, is_helpful, comment, created_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, conversation_id, sender, message_text, intent, data_source, data_available, structured_payload, created_at) FROM stdin;
5	3	USER	What is the SMV of Back Pocket Attach?	\N	APPLICATION_DATA	t	\N	2026-09-11 16:22:21.697973
6	3	ASSISTANT	**Back Pocket Attach** has a Standard Minute Value (SMV) of **0.55 minutes** (33.0 seconds), using **Single Needle Lockstitch (SNLS)**.	GET_OPERATION_SMV	APPLICATION_DATA	t	{"type":"METRIC","title":"Back Pocket Attach","headers":null,"rows":null,"metrics":{"Operation":"Back Pocket Attach","SMV (min)":0.55,"SMV (sec)":33.0,"Machine":"Single Needle Lockstitch (SNLS)"},"chartData":null}	2026-09-11 16:22:21.741263
7	4	USER	Which operation is the bottleneck on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 16:22:43.836043
8	4	ASSISTANT	The primary pacing bottleneck on **LINE-01** is **Station #06 (Side Seam Close)** with an effective cycle time of **42.9 seconds**, setting the maximum output ceiling for the line.	GET_BOTTLENECK_STATION	APPLICATION_DATA	t	{"type":"ALERT","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-11 16:22:43.85058
155	69	USER	STY-DENIM-900	\N	APPLICATION_DATA	t	\N	2026-09-12 09:59:22.099123
156	69	ASSISTANT	I am SewNexa AI. You can ask me about:\n\n• **Operation SMVs & Machines** (e.g. *Bottom Hem, Shoulder Join*)\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 09:59:22.103543
159	69	USER	Which operators are assigned to Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:00:57.029051
160	69	ASSISTANT	There are **10 operators** assigned to **LINE-01**.	GET_OPERATOR_ASSIGNMENT	APPLICATION_DATA	t	{"type":"TABLE","title":"LINE-01 Assigned Operators","headers":["Operator","Emp ID","Assigned Line","Role","Department"],"rows":[{"Operator":"Priya Sharma","Emp ID":"EMP-001","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Rajesh Kumar","Emp ID":"EMP-002","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Ananya Roy","Emp ID":"EMP-003","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Deepa Patel","Emp ID":"EMP-004","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Suresh Nair","Emp ID":"EMP-005","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Fatima Begum","Emp ID":"EMP-006","Assigned Line":"LINE-01","Role":"FLOATER","Department":"Sewing Line 1"},{"Operator":"Manoj Verma","Emp ID":"EMP-007","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Kavita Sundaram","Emp ID":"EMP-008","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 2"},{"Operator":"Vikramaditya Rao","Emp ID":"EMP-009","Assigned Line":"LINE-01","Role":"LINE_SUPERVISOR","Department":"Sewing Line 2"},{"Operator":"Meera Krishnan","Emp ID":"EMP-010","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 2"}],"metrics":null,"chartData":null}	2026-09-12 10:00:57.065079
13	7	USER	hello	\N	APPLICATION_DATA	t	\N	2026-09-11 16:43:48.350152
14	7	ASSISTANT	I am your SewNexa Copilot. You can ask me about:\n\n• **Operation SMVs & Machines**\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-11 16:43:48.364196
165	72	USER	Explain why line 1 has 22 operators in a creative friendly way	\N	APPLICATION_DATA	t	\N	2026-09-12 10:18:35.698536
166	72	ASSISTANT	I am SewNexa AI. You can ask me about:\n\n• **Operation SMVs & Machines** (e.g. *Bottom Hem, Shoulder Join*)\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 10:18:35.702263
29	10	USER	What is the SMV of Bottom Hem?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:21:40.364059
30	10	ASSISTANT	**Bottom Hem** (OP-007) has a Standard Minute Value (SMV) of **1.20 minutes** (72.0 seconds), using **Flatlock / Interlock**.	GET_OPERATION_SMV	APPLICATION_DATA	t	{"type":"METRIC","title":"Bottom Hem","headers":null,"rows":null,"metrics":{"Operation":"Bottom Hem","Code":"OP-007","SMV (min)":1.2,"SMV (sec)":72.0,"Machine":"Flatlock / Interlock"},"chartData":null}	2026-09-11 17:21:40.36931
31	11	USER	What is the SMV of Shoulder Join?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:21:40.414734
32	11	ASSISTANT	I couldn't find an operation matching 'the query' in the application data.	GET_OPERATION_SMV	APPLICATION_DATA	f	\N	2026-09-11 17:21:40.416874
33	12	USER	Which operation is the bottleneck on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:21:40.426558
34	12	ASSISTANT	The primary pacing bottleneck on **LINE-01** is **Station #06 (Side Seam Close)** with an effective cycle time of **42.9 seconds**, setting the maximum output ceiling for the line.	GET_BOTTLENECK_STATION	APPLICATION_DATA	t	{"type":"ALERT","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-11 17:21:40.430349
35	13	USER	How many operators are on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:21:40.437252
36	13	ASSISTANT	**LINE-01** (Line 01 - Polo & T-Shirt) currently has **22 assigned production operators**.	GET_LINE_MANPOWER	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Configuration","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Name":"Line 01 - Polo & T-Shirt","Assigned Operators":22,"Installed Machines":24,"Capacity / Day":"1200 pcs"},"chartData":null}	2026-09-11 17:21:40.440061
37	14	USER	Show all operations	\N	APPLICATION_DATA	t	\N	2026-09-11 17:21:40.44719
38	14	ASSISTANT	I am your SewNexa Copilot. You can ask me about:\n\n• **Operation SMVs & Machines**\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-11 17:21:40.449348
43	17	USER	What is the SMV of Bottom Hem?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:32.902677
44	17	ASSISTANT	**Bottom Hem** (OP-007) has a Standard Minute Value (SMV) of **1.20 minutes** (72.0 seconds), using **Flatlock / Interlock**.	GET_OPERATION_SMV	APPLICATION_DATA	t	{"type":"METRIC","title":"Bottom Hem","headers":null,"rows":null,"metrics":{"Operation":"Bottom Hem","Code":"OP-007","SMV (min)":1.2,"SMV (sec)":72.0,"Machine":"Flatlock / Interlock"},"chartData":null}	2026-09-11 17:29:32.935488
45	18	USER	What is the SMV of Shoulder Join?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:32.99232
46	18	ASSISTANT	**Shoulder Join** (OP-001) has a Standard Minute Value (SMV) of **0.40 minutes** (24.0 seconds), using **4-Thread Overlock**.	GET_OPERATION_SMV	APPLICATION_DATA	t	{"type":"METRIC","title":"Shoulder Join","headers":null,"rows":null,"metrics":{"Operation":"Shoulder Join","Code":"OP-001","SMV (min)":0.4,"SMV (sec)":24.0,"Machine":"4-Thread Overlock"},"chartData":null}	2026-09-11 17:29:32.996565
47	19	USER	Which operation is the bottleneck on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:33.010519
48	19	ASSISTANT	The primary pacing bottleneck on **LINE-01** is **Bottom Hem** with an effective cycle time of **72.0 seconds** (SMV: 1.20 min, Capacity: 50 pcs/hr), setting the maximum output ceiling for the line.	GET_BOTTLENECK_STATION	APPLICATION_DATA	t	{"type":"ALERT","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-11 17:29:33.027158
49	20	USER	How many operators are on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:33.042812
50	20	ASSISTANT	**LINE-01** (Line 01 - Polo & T-Shirt) currently has **22 assigned production operators**.	GET_LINE_MANPOWER	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Configuration","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Name":"Line 01 - Polo & T-Shirt","Assigned Operators":22,"Installed Machines":24,"Capacity / Day":"1,200 pcs"},"chartData":null}	2026-09-11 17:29:33.052852
51	21	USER	Show all operations	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:33.069913
52	21	ASSISTANT	Style **STY-TSHIRT-480** (Classic Crew Neck T-Shirt (Line Balance Benchmark), Buyer: Zara Men) has 5 operations with a total SMV of **3.50 minutes**.	GET_STYLE_OPERATIONS	APPLICATION_DATA	t	{"type":"TABLE","title":"Style STY-TSHIRT-480 (OB-TS-480)","headers":["Seq","Operation","SMV (min)","Machine"],"rows":[{"Seq":1,"Operation":"Shoulder Join","SMV (min)":0.4,"Machine":"Overlock 4-Thread"},{"Seq":2,"Operation":"Sleeve Attach Left","SMV (min)":0.75,"Machine":"Overlock 4-Thread"},{"Seq":3,"Operation":"Side Seam Close","SMV (min)":0.5,"Machine":"Overlock 4-Thread"},{"Seq":4,"Operation":"Bottom Hem","SMV (min)":1.2,"Machine":"Flatlock / Coverstitch"},{"Seq":5,"Operation":"Neck Rib Attach","SMV (min)":0.65,"Machine":"Flatlock Cylindrical"}],"metrics":null,"chartData":null}	2026-09-11 17:29:33.116317
53	22	USER	What is the Line Balancing Efficiency of Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:33.134879
54	22	ASSISTANT	**LINE-01** currently operates at a **Line Balancing Efficiency (LBE) of 76.8%** (Balance Delay: 23.2%, Bottleneck: 72.0s).	GET_LINE_BALANCE_EFFICIENCY	APPLICATION_DATA	t	{"type":"TABLE","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-11 17:29:33.146238
55	23	USER	What is today's production for Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-11 17:29:33.159996
56	23	ASSISTANT	**LINE-01** has produced **420 good pieces** today (Target: 450 pcs, Rejects: 0 pcs, Actual Efficiency: **93.3%**).	GET_TODAY_PRODUCTION	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Floor Status","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Today Output":"420 pcs","Target Output":"450 pcs","Rejects":"0 pcs","Actual Efficiency":"93.3%"},"chartData":null}	2026-09-11 17:29:33.172055
157	69	USER	what is the skill matrix	\N	APPLICATION_DATA	t	\N	2026-09-12 10:00:45.236094
158	69	ASSISTANT	The workforce database contains **50 active sewing operators** across all lines and shifts (22 assigned to LINE-01).	GET_OPERATOR_SKILL	APPLICATION_DATA	t	\N	2026-09-12 10:00:45.236094
171	70	USER	Show hourly production for LINE-01	\N	APPLICATION_DATA	t	\N	2026-09-12 10:19:57.285996
63	27	USER	what is total quantity ordered by netplay	\N	APPLICATION_DATA	t	\N	2026-09-11 17:41:07.627628
64	27	ASSISTANT	Buyer **Netplay** has ordered a total of **12,000 garments** under Purchase Order **PO-2026-003** (Style: ST-002, Delivery Date: 2026-09-13, Status: PLANNED).	GET_ORDER_DETAILS	APPLICATION_DATA	t	{"type":"METRIC","title":"Orders for Netplay","headers":["Order No","Style","Quantity","Delivery Date","Status"],"rows":[{"Order No":"PO-2026-003","Style":"ST-002","Quantity":"12,000 pcs","Delivery Date":"2026-09-13","Status":"PLANNED"}],"metrics":{"Buyer":"Netplay","Total Ordered Quantity":"12,000 pcs","Total Orders":1},"chartData":null}	2026-09-11 17:41:07.653706
65	28	USER	what is total quantity ordered by Zara Men	\N	APPLICATION_DATA	t	\N	2026-09-11 17:41:15.170004
172	70	ASSISTANT	**LINE-01** has produced **420 good pieces** today (Target: 450 pcs, Rejects: 0 pcs, Actual Efficiency: **93.3%**).	GET_TODAY_PRODUCTION	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Floor Status","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Today Output":"420 pcs","Target Output":"450 pcs","Rejects":"0 pcs","Actual Efficiency":"93.3%"},"chartData":null}	2026-09-12 10:19:57.297028
178	75	ASSISTANT	I am SewNexa AI. You can ask me about:\n\n• **Operation SMVs & Machines** (e.g. *Bottom Hem, Shoulder Join*)\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.551216
179	76	USER	Show me today's production for Line 01	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.559251
183	78	USER	Who are the operators assigned to Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.590242
66	28	ASSISTANT	Buyer **Zara Men** has ordered a total of **4,800 garments** under Purchase Order **PO-2026-002** (Style: STY-TSHIRT-480, Delivery Date: 2026-09-24, Status: IN_PRODUCTION).	GET_ORDER_DETAILS	APPLICATION_DATA	t	{"type":"METRIC","title":"Orders for Zara Men","headers":["Order No","Style","Quantity","Delivery Date","Status"],"rows":[{"Order No":"PO-2026-002","Style":"STY-TSHIRT-480","Quantity":"4,800 pcs","Delivery Date":"2026-09-24","Status":"IN_PRODUCTION"}],"metrics":{"Buyer":"Zara Men","Total Ordered Quantity":"4,800 pcs","Total Orders":1},"chartData":null}	2026-09-11 17:41:15.176519
67	29	USER	how many garments ordered by Levi Strauss	\N	APPLICATION_DATA	t	\N	2026-09-11 17:41:15.206087
68	29	ASSISTANT	Buyer **Levi Strauss & Co** has ordered a total of **620 garments** under Purchase Order **PO-LEVIS-CHINO-620** (Style: STY-DENIM-900, Delivery Date: 2026-09-28, Status: PLANNED).	GET_ORDER_DETAILS	APPLICATION_DATA	t	{"type":"METRIC","title":"Orders for Levi Strauss & Co","headers":["Order No","Style","Quantity","Delivery Date","Status"],"rows":[{"Order No":"PO-LEVIS-CHINO-620","Style":"STY-DENIM-900","Quantity":"620 pcs","Delivery Date":"2026-09-28","Status":"PLANNED"}],"metrics":{"Buyer":"Levi Strauss & Co","Total Ordered Quantity":"620 pcs","Total Orders":1},"chartData":null}	2026-09-11 17:41:15.210882
69	30	USER	what is the total order quantity across all buyers	\N	APPLICATION_DATA	t	\N	2026-09-11 17:41:15.225234
70	30	ASSISTANT	The plant currently has **4 active purchase orders** totaling **31,420 garments** (Netplay: 12,000 pcs, Zara Men: 4,800 pcs, Levi Strauss & Co: 620 pcs).	GET_ORDER_QUANTITY	APPLICATION_DATA	t	{"type":"TABLE","title":"Production Orders Master","headers":["Order No","Buyer","Style","Quantity","Delivery Date","Status"],"rows":[{"Order No":"PO-2026-003","Buyer":"Netplay","Style":"ST-002","Quantity":"12,000 pcs","Delivery Date":"2026-09-13","Status":"PLANNED"},{"Order No":"PO-2026-002","Buyer":"Zara Men","Style":"STY-TSHIRT-480","Quantity":"4,800 pcs","Delivery Date":"2026-09-24","Status":"IN_PRODUCTION"},{"Order No":"PO-UNIQLO-DENIM-900","Buyer":"Uniqlo LifeWear","Style":"STY-DENIM-900","Quantity":"14,000 pcs","Delivery Date":"2026-10-23","Status":"PLANNED"},{"Order No":"PO-LEVIS-CHINO-620","Buyer":"Levi Strauss & Co","Style":"STY-DENIM-900","Quantity":"620 pcs","Delivery Date":"2026-09-28","Status":"PLANNED"}],"metrics":null,"chartData":null}	2026-09-11 17:41:15.24415
71	31	USER	status of order PO-2026-003	\N	APPLICATION_DATA	t	\N	2026-09-11 17:41:15.260187
72	31	ASSISTANT	Purchase Order **PO-2026-003** (Buyer: Netplay, Style: ST-002) has a target quantity of **12,000 garments**. Completed production: **0 pcs** (0.0% progress, Status: PLANNED).	GET_ORDER_DETAILS	APPLICATION_DATA	t	{"type":"METRIC","title":"Order PO-2026-003","headers":null,"rows":null,"metrics":{"Order Code":"PO-2026-003","Buyer":"Netplay","Style":"ST-002","Target Quantity":"12,000 pcs","Completed":"0 pcs","Progress":"0.0%","Delivery Date":"2026-09-13","Status":"PLANNED"},"chartData":null}	2026-09-11 17:41:15.27886
73	32	USER	what is the total quantity ordered by Adidas	\N	APPLICATION_DATA	t	\N	2026-09-11 17:41:15.294706
74	32	ASSISTANT	I couldn't find any orders for buyer **Adidas**. Active buyers in the database are: **Netplay**, **Zara Men**, and **Levi Strauss & Co**.	GET_ORDER_DETAILS	APPLICATION_DATA	f	\N	2026-09-11 17:41:15.310476
153	69	USER	what is the total smv of Uniqlo LifeWear bulletin	\N	APPLICATION_DATA	t	\N	2026-09-12 09:58:24.309877
154	69	ASSISTANT	Style **STY-TSHIRT-480** (Classic Crew Neck T-Shirt (Line Balance Benchmark)) has a total garment work content of **3.50 minutes** (210.0 seconds) across 5 operations in Bulletin **OB-TS-480**.	GET_STYLE_TOTAL_SMV	APPLICATION_DATA	t	{"type":"TABLE","title":"Style STY-TSHIRT-480 (OB-TS-480)","headers":["Seq","Operation","SMV (min)","Machine"],"rows":[{"Seq":1,"Operation":"Shoulder Join","SMV (min)":0.4,"Machine":"Overlock 4-Thread"},{"Seq":2,"Operation":"Sleeve Attach Left","SMV (min)":0.75,"Machine":"Overlock 4-Thread"},{"Seq":3,"Operation":"Side Seam Close","SMV (min)":0.5,"Machine":"Overlock 4-Thread"},{"Seq":4,"Operation":"Bottom Hem","SMV (min)":1.2,"Machine":"Flatlock / Coverstitch"},{"Seq":5,"Operation":"Neck Rib Attach","SMV (min)":0.65,"Machine":"Flatlock Cylindrical"}],"metrics":null,"chartData":null}	2026-09-12 09:58:24.371885
161	70	USER	How many operators are assigned to Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:16:34.311908
162	70	ASSISTANT	**LINE-01** (Line 01 - Polo & T-Shirt) currently has **22 assigned production operators**.	GET_LINE_MANPOWER	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Configuration","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Name":"Line 01 - Polo & T-Shirt","Assigned Operators":22,"Installed Machines":24,"Capacity / Day":"1,200 pcs"},"chartData":null}	2026-09-12 10:16:34.343764
163	71	USER	What is the target for Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:18:29.896113
164	71	ASSISTANT	**LINE-01** (Line 01 - Polo & T-Shirt) is configured with **22 operators**, **24 machines**, and a nominal capacity of **1,200 pcs/day** (8.0 working hours/shift).	GET_LINE_DETAILS	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Configuration","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Name":"Line 01 - Polo & T-Shirt","Assigned Operators":22,"Installed Machines":24,"Capacity / Day":"1,200 pcs"},"chartData":null}	2026-09-12 10:18:29.899391
167	70	USER	hello	\N	APPLICATION_DATA	t	\N	2026-09-12 10:19:29.657588
168	70	ASSISTANT	I am SewNexa AI. You can ask me about:\n\n• **Operation SMVs & Machines** (e.g. *Bottom Hem, Shoulder Join*)\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 10:19:29.663001
169	70	USER	What is today's production for Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:19:40.228911
170	70	ASSISTANT	**LINE-01** has produced **420 good pieces** today (Target: 450 pcs, Rejects: 0 pcs, Actual Efficiency: **93.3%**).	GET_TODAY_PRODUCTION	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Floor Status","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Today Output":"420 pcs","Target Output":"450 pcs","Rejects":"0 pcs","Actual Efficiency":"93.3%"},"chartData":null}	2026-09-12 10:19:40.246342
173	73	USER	What styles do we have in the system?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.505704
174	73	ASSISTANT	Style **STY-TSHIRT-480** (Classic Crew Neck T-Shirt (Line Balance Benchmark), Buyer: Zara Men) has 5 operations with a total SMV of **3.50 minutes**.	GET_STYLE_DETAILS	APPLICATION_DATA	t	{"type":"TABLE","title":"Style STY-TSHIRT-480 (OB-TS-480)","headers":["Seq","Operation","SMV (min)","Machine"],"rows":[{"Seq":1,"Operation":"Shoulder Join","SMV (min)":0.4,"Machine":"Overlock 4-Thread"},{"Seq":2,"Operation":"Sleeve Attach Left","SMV (min)":0.75,"Machine":"Overlock 4-Thread"},{"Seq":3,"Operation":"Side Seam Close","SMV (min)":0.5,"Machine":"Overlock 4-Thread"},{"Seq":4,"Operation":"Bottom Hem","SMV (min)":1.2,"Machine":"Flatlock / Coverstitch"},{"Seq":5,"Operation":"Neck Rib Attach","SMV (min)":0.65,"Machine":"Flatlock Cylindrical"}],"metrics":null,"chartData":null}	2026-09-12 10:29:55.524183
175	74	USER	How many orders are currently active?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.534963
177	75	USER	What is the status of Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.547367
176	74	ASSISTANT	The plant currently has **4 active purchase orders** totaling **31,420 garments** (Netplay: 12,000 pcs, Zara Men: 4,800 pcs, Levi Strauss & Co: 620 pcs).	GET_ORDER_DETAILS	APPLICATION_DATA	t	{"type":"TABLE","title":"Production Orders Master","headers":["Order No","Buyer","Style","Quantity","Delivery Date","Status"],"rows":[{"Order No":"PO-2026-003","Buyer":"Netplay","Style":"ST-002","Quantity":"12,000 pcs","Delivery Date":"2026-09-13","Status":"PLANNED"},{"Order No":"PO-2026-002","Buyer":"Zara Men","Style":"STY-TSHIRT-480","Quantity":"4,800 pcs","Delivery Date":"2026-09-24","Status":"IN_PRODUCTION"},{"Order No":"PO-UNIQLO-DENIM-900","Buyer":"Uniqlo LifeWear","Style":"STY-DENIM-900","Quantity":"14,000 pcs","Delivery Date":"2026-10-23","Status":"PLANNED"},{"Order No":"PO-LEVIS-CHINO-620","Buyer":"Levi Strauss & Co","Style":"STY-DENIM-900","Quantity":"620 pcs","Delivery Date":"2026-09-28","Status":"PLANNED"}],"metrics":null,"chartData":null}	2026-09-12 10:29:55.539957
181	77	USER	What is the bottleneck station on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.577499
182	77	ASSISTANT	The primary pacing bottleneck on **LINE-01** is **Bottom Hem** with an effective cycle time of **72.0 seconds** (SMV: 1.20 min, Capacity: 50 pcs/hr), setting the maximum output ceiling for the line.	GET_BOTTLENECK_STATION	APPLICATION_DATA	t	{"type":"ALERT","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-12 10:29:55.583504
195	84	USER	Compare Line 01 and Line 02	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.662767
196	84	ASSISTANT	Here is the operational comparison across sewing lines for today's production run:	COMPARE_LINES	APPLICATION_DATA	t	{"type":"COMPARISON","title":"Sewing Line Comparison","headers":["Line","Operators","Capacity/Day","Actual Output","Efficiency %"],"rows":[{"Line":"LINE-01","Operators":22,"Capacity/Day":1200,"Actual Output":420,"Efficiency %":76.4}],"metrics":null,"chartData":[{"actual":420,"name":"LINE-01","target":1200}]}	2026-09-12 10:29:55.664774
201	87	USER	Who is the buyer for PO-2026-001?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.687214
202	87	ASSISTANT	I couldn't find any orders for buyer **For PO-2026-001**. Active buyers in the database are: **Netplay**, **Zara Men**, and **Levi Strauss & Co**.	GET_ORDER_DETAILS	APPLICATION_DATA	f	\N	2026-09-12 10:29:55.689354
180	76	ASSISTANT	**LINE-01** has produced **420 good pieces** today (Target: 450 pcs, Rejects: 0 pcs, Actual Efficiency: **93.3%**).	GET_TODAY_PRODUCTION	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Floor Status","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Today Output":"420 pcs","Target Output":"450 pcs","Rejects":"0 pcs","Actual Efficiency":"93.3%"},"chartData":null}	2026-09-12 10:29:55.570482
191	82	USER	Who is absent today?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.638278
192	82	ASSISTANT	Attendance for **2026-09-08**: **50 total** operators — **46 Present** (4 Late), **0 Absent**, 0 Half-Day, 4 On Leave.	GET_OPERATOR_ATTENDANCE	APPLICATION_DATA	t	{"type":"TABLE","title":"Attendance Register — 2026-09-08","headers":["Operator","Emp ID","Status","Check In","Remarks"],"rows":[{"Operator":"Priya Sharma","Emp ID":"EMP-001","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Rajesh Kumar","Emp ID":"EMP-002","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Ananya Roy","Emp ID":"EMP-003","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Deepa Patel","Emp ID":"EMP-004","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Suresh Nair","Emp ID":"EMP-005","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Fatima Begum","Emp ID":"EMP-006","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Manoj Verma","Emp ID":"EMP-007","Status":"ON_LEAVE","Check In":"08:40","Remarks":"Biometric floor punch-in"},{"Operator":"Kavita Sundaram","Emp ID":"EMP-008","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Vikramaditya Rao","Emp ID":"EMP-009","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Meera Krishnan","Emp ID":"EMP-010","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Arjun Sengupta","Emp ID":"EMP-011","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Pooja Deshmukh","Emp ID":"EMP-012","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Mohanlal Meena","Emp ID":"EMP-013","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Sunita Mahajan","Emp ID":"EMP-014","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Rohan Kulkarni","Emp ID":"EMP-015","Status":"LATE","Check In":"08:40","Remarks":"Biometric floor punch-in"},{"Operator":"Naresh Soni","Emp ID":"EMP-016","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Umesh Rao","Emp ID":"EMP-017","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Ganesh Reddy","Emp ID":"EMP-018","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Santosh Nair","Emp ID":"EMP-019","Status":"ON_LEAVE","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Yogesh Pillai","Emp ID":"EMP-020","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Pooja Das","Emp ID":"EMP-021","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Neha Devi","Emp ID":"EMP-022","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Asha Kumari","Emp ID":"EMP-023","Status":"LATE","Check In":"08:40","Remarks":"Biometric floor punch-in"},{"Operator":"Usha Bai","Emp ID":"EMP-024","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Manju Khan","Emp ID":"EMP-025","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Saroj Ansari","Emp ID":"EMP-026","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Kamlesh Sheikh","Emp ID":"EMP-027","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Vijay Siddiqui","Emp ID":"EMP-028","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Ajay Malik","Emp ID":"EMP-029","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Sanjay Thakur","Emp ID":"EMP-030","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Arun Rathore","Emp ID":"EMP-031","Status":"ON_LEAVE","Check In":"08:40","Remarks":"Biometric floor punch-in"},{"Operator":"Tarun Rajput","Emp ID":"EMP-032","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Varun Bhatt","Emp ID":"EMP-033","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Kiran Mehta","Emp ID":"EMP-034","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Nisha Shah","Emp ID":"EMP-035","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Ritu Kapoor","Emp ID":"EMP-036","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Seema Malhotra","Emp ID":"EMP-037","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Reena Bhatia","Emp ID":"EMP-038","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Veena Khanna","Emp ID":"EMP-039","Status":"LATE","Check In":"08:40","Remarks":"Biometric floor punch-in"},{"Operator":"Leena Ahuja","Emp ID":"EMP-040","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Mohan Arora","Emp ID":"EMP-041","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Rohan Sethi","Emp ID":"EMP-042","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Sohan Chopra","Emp ID":"EMP-043","Status":"ON_LEAVE","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Laxman Walia","Emp ID":"EMP-044","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Raman Bansal","Emp ID":"EMP-045","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Bharat Mittal","Emp ID":"EMP-046","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Madan Agarwal","Emp ID":"EMP-047","Status":"LATE","Check In":"08:40","Remarks":"Biometric floor punch-in"},{"Operator":"Chandan Goyal","Emp ID":"EMP-048","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Nandan Jain","Emp ID":"EMP-049","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"},{"Operator":"Pawan Tiwari","Emp ID":"EMP-050","Status":"PRESENT","Check In":"08:00","Remarks":"Biometric floor punch-in"}],"metrics":null,"chartData":null}	2026-09-12 10:29:55.650324
199	86	USER	Explain how Takt Time is calculated	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.679181
200	86	ASSISTANT	The Customer Takt Time for **Plan CAP-PO-UNIQLO-DENIM-900-5384** (Order: PO-UNIQLO-DENIM-900, Style: Classic Trucker Denim Jacket) is **43.4 seconds**.	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-UNIQLO-DENIM-900-5384","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-UNIQLO-DENIM-900-5384","Order":"PO-UNIQLO-DENIM-900","Customer Takt":"43.4 sec","Design Pitch":"34.7 sec","Planned Efficiency":"80%","Required Design Cap":"103.8 pcs/hr","Planned Manpower":"5 Operators","Garment SMV":"3.38 min"},"chartData":null}	2026-09-12 10:29:55.68218
211	92	USER	Which operator has the highest skill rating in Overlock?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.736168
212	92	ASSISTANT	The workforce database contains **50 active sewing operators** across all lines and shifts (22 assigned to LINE-01).	GET_OPERATOR_SKILL	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.738164
184	78	ASSISTANT	There are **10 operators** assigned to **LINE-01**.	GET_OPERATOR_ASSIGNMENT	APPLICATION_DATA	t	{"type":"TABLE","title":"LINE-01 Assigned Operators","headers":["Operator","Emp ID","Assigned Line","Role","Department"],"rows":[{"Operator":"Priya Sharma","Emp ID":"EMP-001","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Rajesh Kumar","Emp ID":"EMP-002","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Ananya Roy","Emp ID":"EMP-003","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Deepa Patel","Emp ID":"EMP-004","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Suresh Nair","Emp ID":"EMP-005","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Fatima Begum","Emp ID":"EMP-006","Assigned Line":"LINE-01","Role":"FLOATER","Department":"Sewing Line 1"},{"Operator":"Manoj Verma","Emp ID":"EMP-007","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 1"},{"Operator":"Kavita Sundaram","Emp ID":"EMP-008","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 2"},{"Operator":"Vikramaditya Rao","Emp ID":"EMP-009","Assigned Line":"LINE-01","Role":"LINE_SUPERVISOR","Department":"Sewing Line 2"},{"Operator":"Meera Krishnan","Emp ID":"EMP-010","Assigned Line":"LINE-01","Role":"OPERATOR","Department":"Sewing Line 2"}],"metrics":null,"chartData":null}	2026-09-12 10:29:55.6017
203	88	USER	What operations are in style STY-POLO-800?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.697681
204	88	ASSISTANT	Style **STY-POLO-800** (Dri-FIT Men Athletic Pique Polo, Buyer: Nike Sportswear) has 5 operations with a total SMV of **4.25 minutes**.	GET_STYLE_DETAILS	APPLICATION_DATA	t	{"type":"TABLE","title":"Style STY-POLO-800 (OB-POLO-800)","headers":["Seq","Operation","SMV (min)","Machine"],"rows":[{"Seq":1,"Operation":"Neck Top Stitch","SMV (min)":0.85,"Machine":"Single Needle Lockstitch"},{"Seq":2,"Operation":"Sleeve Attach Right","SMV (min)":0.95,"Machine":"Single Needle Lockstitch"},{"Seq":3,"Operation":"Shoulder Join","SMV (min)":0.45,"Machine":"Overlock 4-Thread"},{"Seq":4,"Operation":"Sleeve Attach Left","SMV (min)":0.8,"Machine":"Overlock 4-Thread"},{"Seq":5,"Operation":"Bottom Hem","SMV (min)":1.2,"Machine":"Flatlock / Coverstitch"}],"metrics":null,"chartData":null}	2026-09-12 10:29:55.702678
185	79	USER	What is the SMV of Bottom Hem?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.60918
186	79	ASSISTANT	**Bottom Hem** (OP-007) has a Standard Minute Value (SMV) of **1.20 minutes** (72.0 seconds), using **Flatlock / Interlock**.	GET_OPERATION_SMV	APPLICATION_DATA	t	{"type":"METRIC","title":"Bottom Hem","headers":null,"rows":null,"metrics":{"Operation":"Bottom Hem","Code":"OP-007","SMV (min)":1.2,"SMV (sec)":72.0,"Machine":"Flatlock / Interlock"},"chartData":null}	2026-09-12 10:29:55.612183
197	85	USER	What is the Line Balancing Efficiency of Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.669113
198	85	ASSISTANT	**LINE-01** currently operates at a **Line Balancing Efficiency (LBE) of 76.8%** (Balance Delay: 23.2%, Bottleneck: 72.0s).	GET_LINE_BALANCE_EFFICIENCY	APPLICATION_DATA	t	{"type":"TABLE","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-12 10:29:55.673113
205	89	USER	What recommendations do you have to optimize Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.707265
206	89	ASSISTANT	### Optimization & Rebalancing Plan for **Line 01 - Polo & T-Shirt**:\n\n**Primary Bottleneck**: **Bottom Hem** (Cycle Time: **72.0 seconds**, Designed Pitch: **41.1 seconds**).\n\n**Recommended Actions**:\n1. **Parallel Station Addition** *(Recommended)*:\n   • Add a secondary workstation or helper for **Bottom Hem**.\n   • **Impact**: Reduces station cycle time from **72.0 seconds** to **36.0 seconds**.\n   • **Output Gain**: Increases line ceiling from **50 pcs/hr** to **87.5 pcs/hr**.\n\n2. **Workload Redistribution & Split**:\n   • Re-allocate minor seam preparation tasks from Station S06 to under-loaded Station S05.\n   • **Expected Line Balance Efficiency (LBE)**: Increases from **76.8%** to **88.4%**.\n   • **Balance Delay Reduction**: Decreases from **23.2%** to **11.6%**.\n\n3. **Skill-Matrix Operator Alignment**:\n   • Assign Grade A/A+ sewers with $\\ge$85% historical efficiency to critical seam operations.\n	OPTIMIZATION_RECOMMENDATIONS	APPLICATION_DATA	t	{"type":"METRIC","title":"Rebalancing Proposals","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Current Bottleneck":"Bottom Hem (72.0s)","Current LBE":"76.8%","Projected LBE":"88.4%","Output Ceiling Gain":"+75% (50 → 87.5 pcs/hr)"},"chartData":null}	2026-09-12 10:29:55.71567
187	80	USER	Which machine is used for Neck Rib Attach?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.618179
188	80	ASSISTANT	**Neck Rib Attach** (OP-002) requires a **4-Thread Overlock** machine.	GET_OPERATION_MACHINE	APPLICATION_DATA	t	{"type":"METRIC","title":"Neck Rib Attach","headers":null,"rows":null,"metrics":{"Operation":"Neck Rib Attach","Code":"OP-002","SMV (min)":0.65,"SMV (sec)":39.0,"Machine":"4-Thread Overlock"},"chartData":null}	2026-09-12 10:29:55.620178
193	83	USER	How many single needle machines do we have?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.656333
194	83	ASSISTANT	I am SewNexa AI. You can ask me about:\n\n• **Operation SMVs & Machines** (e.g. *Bottom Hem, Shoulder Join*)\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.656333
207	90	USER	How many pieces did Line 01 produce this hour?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.720685
208	90	ASSISTANT	**LINE-01** has produced **420 good pieces** today (Target: 450 pcs, Rejects: 0 pcs, Actual Efficiency: **93.3%**).	GET_TODAY_PRODUCTION	APPLICATION_DATA	t	{"type":"METRIC","title":"LINE-01 Floor Status","headers":null,"rows":null,"metrics":{"Line":"LINE-01","Today Output":"420 pcs","Target Output":"450 pcs","Rejects":"0 pcs","Actual Efficiency":"93.3%"},"chartData":null}	2026-09-12 10:29:55.72612
189	81	USER	What is the takt time for Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.626157
190	81	ASSISTANT	The Customer Takt Time for **Plan CAP-PO-UNIQLO-DENIM-900-5384** (Order: PO-UNIQLO-DENIM-900, Style: Classic Trucker Denim Jacket) is **43.4 seconds**.	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-UNIQLO-DENIM-900-5384","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-UNIQLO-DENIM-900-5384","Order":"PO-UNIQLO-DENIM-900","Customer Takt":"43.4 sec","Design Pitch":"34.7 sec","Planned Efficiency":"80%","Required Design Cap":"103.8 pcs/hr","Planned Manpower":"5 Operators","Garment SMV":"3.38 min"},"chartData":null}	2026-09-12 10:29:55.633158
209	91	USER	Tell me about operator Ramu	\N	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.731152
210	91	ASSISTANT	I am SewNexa AI. You can ask me about:\n\n• **Operation SMVs & Machines** (e.g. *Bottom Hem, Shoulder Join*)\n• **Line Capacity, Takt & Pitch Times**\n• **Workstations & Bottlenecks**\n• **Operator Headcount & Skill Matrix**\n• **Today's Production & Line Efficiency**	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 10:29:55.732154
217	95	USER	what is skill rating	\N	APPLICATION_DATA	t	\N	2026-09-12 10:52:58.000739
218	95	ASSISTANT	I couldn't find that information in the application data.	GET_OPERATOR_SKILL	APPLICATION_DATA	t	\N	2026-09-12 10:53:05.450089
219	95	USER	what is svm of netplay	\N	APPLICATION_DATA	t	\N	2026-09-12 10:53:28.688217
220	95	ASSISTANT	I couldn't find that information in the application data.	GENERAL_HELP	APPLICATION_DATA	t	\N	2026-09-12 10:53:34.033429
221	95	USER	what is total svm of Uniqlo LifeWear bulletin	\N	APPLICATION_DATA	t	\N	2026-09-12 10:54:13.924977
222	95	ASSISTANT	I couldn't find that information in the application data.	GET_OB_DETAILS	APPLICATION_DATA	t	{"type":"TABLE","title":"Style STY-TSHIRT-480 (OB-TS-480)","headers":["Seq","Operation","SMV (min)","Machine"],"rows":[{"Seq":1,"Operation":"Shoulder Join","SMV (min)":0.4,"Machine":"Overlock 4-Thread"},{"Seq":2,"Operation":"Sleeve Attach Left","SMV (min)":0.75,"Machine":"Overlock 4-Thread"},{"Seq":3,"Operation":"Side Seam Close","SMV (min)":0.5,"Machine":"Overlock 4-Thread"},{"Seq":4,"Operation":"Bottom Hem","SMV (min)":1.2,"Machine":"Flatlock / Coverstitch"},{"Seq":5,"Operation":"Neck Rib Attach","SMV (min)":0.65,"Machine":"Flatlock Cylindrical"}],"metrics":null,"chartData":null}	2026-09-12 10:54:46.500356
223	96	USER	What is the takt time for order 1?	\N	APPLICATION_DATA	t	\N	2026-09-12 11:44:06.85963
224	96	ASSISTANT	The customer takt time for Order **PO-UNIQLO-DENIM-900** (Plan: CAP-PO-UNIQLO-	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-UNIQLO-DENIM-900-5384","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-UNIQLO-DENIM-900-5384","Order":"PO-UNIQLO-DENIM-900","Customer Takt":"43.4 sec","Design Pitch":"34.7 sec","Planned Efficiency":"80%","Required Design Cap":"103.8 pcs/hr","Planned Manpower":"5 Operators","Garment SMV":"3.38 min"},"chartData":null}	2026-09-12 11:44:32.980091
225	97	USER	What is the takt time for order 1?	\N	APPLICATION_DATA	t	\N	2026-09-12 11:47:54.240668
226	97	ASSISTANT	The Customer Takt Time for **Plan CAP-PO-UNIQLO-DENIM-900-5384** (Order: PO-UNIQLO-DENIM-900, Style: Classic Trucker Denim Jacket) is **43.4 seconds**.	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-UNIQLO-DENIM-900-5384","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-UNIQLO-DENIM-900-5384","Order":"PO-UNIQLO-DENIM-900","Customer Takt":"43.4 sec","Design Pitch":"34.7 sec","Planned Efficiency":"80%","Required Design Cap":"103.8 pcs/hr","Planned Manpower":"5 Operators","Garment SMV":"3.38 min"},"chartData":null}	2026-09-12 11:47:58.080555
231	100	USER	What is the takt time for order 1?	\N	APPLICATION_DATA	t	\N	2026-09-12 12:31:20.392248
232	100	ASSISTANT	The customer takt time for Order **PO-UNIQLO-DENIM-900** (Plan CAP-PO-UNIQLO-DENIM-900-5384, Style: Classic Trucker Denim Jacket) is **43.4 seconds**.	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-UNIQLO-DENIM-900-5384","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-UNIQLO-DENIM-900-5384","Order":"PO-UNIQLO-DENIM-900","Customer Takt":"43.4 sec","Design Pitch":"34.7 sec","Planned Efficiency":"80%","Required Design Cap":"103.8 pcs/hr","Planned Manpower":"5 Operators","Garment SMV":"3.38 min"},"chartData":null}	2026-09-12 12:31:22.61306
233	101	USER	how is customer takt time calculated	\N	APPLICATION_DATA	t	\N	2026-09-12 12:32:38.862482
234	101	ASSISTANT	I couldn't find the specific calculation formula in the application	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-UNIQLO-DENIM-900-5384","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-UNIQLO-DENIM-900-5384","Order":"PO-UNIQLO-DENIM-900","Customer Takt":"43.4 sec","Design Pitch":"34.7 sec","Planned Efficiency":"80%","Required Design Cap":"103.8 pcs/hr","Planned Manpower":"5 Operators","Garment SMV":"3.38 min"},"chartData":null}	2026-09-12 12:32:41.534588
235	102	USER	how is customer takt time calculated	\N	APPLICATION_DATA	t	\N	2026-09-12 12:33:22.875715
236	102	ASSISTANT	I couldn't find that information in the application data.	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-2026-004-2849","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-2026-004-2849","Order":"PO-2026-004","Customer Takt":"50.0 sec","Design Pitch":"40.0 sec","Planned Efficiency":"80%","Required Design Cap":"90.0 pcs/hr","Planned Manpower":"22 Operators","Garment SMV":"15.00 min"},"chartData":null}	2026-09-12 12:33:25.785615
237	103	USER	how is customer takt time calculated	\N	APPLICATION_DATA	t	\N	2026-09-12 12:33:42.372306
238	103	ASSISTANT	I couldn't find that information in	GET_TAKT_TIME	APPLICATION_DATA	t	{"type":"METRIC","title":"Capacity Plan — CAP-PO-2026-004-2849","headers":null,"rows":null,"metrics":{"Plan Code":"CAP-PO-2026-004-2849","Order":"PO-2026-004","Customer Takt":"50.0 sec","Design Pitch":"40.0 sec","Planned Efficiency":"80%","Required Design Cap":"90.0 pcs/hr","Planned Manpower":"22 Operators","Garment SMV":"15.00 min"},"chartData":null}	2026-09-12 12:33:45.174048
243	106	USER	Which operation is the bottleneck on Line 01?	\N	APPLICATION_DATA	t	\N	2026-09-12 16:14:52.826778
244	106	ASSISTANT	The bottleneck operation on **LINE-01** is **Bottom Hem**. \n\nKey metrics for this operation:\n* **Effective Cycle Time:** 72.0 seconds\n* **SMV:** 1.20 min\n* **Capacity:** 50 pcs/hr (sets the maximum output ceiling for the line)	GET_BOTTLENECK_STATION	APPLICATION_DATA	t	{"type":"ALERT","title":"LINE-01 Workstation Balancing","headers":["Station","Cycle Time (s)","Workload %","Bottleneck"],"rows":[],"metrics":null,"chartData":null}	2026-09-12 16:14:56.880498
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	create shifts	SQL	V1__create_shifts.sql	-1141136163	postgres	2026-08-21 13:55:46.671553	33	t
2	2	create operators	SQL	V2__create_operators.sql	-1658301998	postgres	2026-08-21 13:55:46.728044	12	t
3	3	create operations	SQL	V3__create_operations.sql	2083712052	postgres	2026-08-21 13:55:46.748981	12	t
4	4	create sizes	SQL	V4__create_sizes.sql	-1630618972	postgres	2026-08-21 13:55:46.769207	10	t
5	5	create styles	SQL	V5__create_styles.sql	1915044378	postgres	2026-08-21 13:55:46.786202	14	t
6	6	create shift assignments	SQL	V6__create_shift_assignments.sql	2421218	postgres	2026-08-21 13:55:46.809043	21	t
7	7	create skill assessments	SQL	V7__create_skill_assessments.sql	975413408	postgres	2026-08-21 13:55:46.836209	15	t
8	8	create attendance records	SQL	V8__create_attendance_records.sql	443058703	postgres	2026-08-21 13:55:46.858074	16	t
9	9	create orders	SQL	V9__create_orders.sql	968363817	postgres	2026-08-21 13:55:46.881251	18	t
10	10	create operation bulletins	SQL	V10__create_operation_bulletins.sql	-1618496273	postgres	2026-08-21 13:55:46.907845	29	t
11	11	seed shifts	SQL	V11__seed_shifts.sql	754365298	postgres	2026-08-21 13:55:46.943713	4	t
12	12	seed operations	SQL	V12__seed_operations.sql	-1759101529	postgres	2026-08-21 13:55:46.954787	6	t
13	13	seed sizes	SQL	V13__seed_sizes.sql	-1654836257	postgres	2026-08-21 13:55:46.966863	5	t
14	14	seed operators	SQL	V14__seed_operators.sql	1601217624	postgres	2026-08-21 13:55:46.97622	7	t
15	15	seed skill assessments	SQL	V15__seed_skill_assessments.sql	1388869749	postgres	2026-08-21 15:48:58.416561	19	t
16	16	create line plans	SQL	V16__create_line_plans.sql	1308374810	postgres	2026-08-22 10:43:50.712237	71	t
18	18	create operator attachments	SQL	V18__create_operator_attachments.sql	-76841658	postgres	2026-08-22 17:44:30.622371	94	t
19	19	create operator performance logs	SQL	V19__create_operator_performance_logs.sql	1113574449	postgres	2026-08-22 17:44:30.77402	11	t
20	20	create skill matrix history	SQL	V20__create_skill_matrix_history.sql	-1559597654	postgres	2026-08-22 17:44:30.797126	8	t
21	17	create audit logs	SQL	V17__create_audit_logs.sql	962164731	postgres	2026-08-22 17:46:47.178159	18	t
22	21	add status to operator performance logs	SQL	V21__add_status_to_operator_performance_logs.sql	-458960787	postgres	2026-08-24 15:07:32.428607	41	t
23	22	clear abhinav skill matrix	SQL	V22__clear_abhinav_skill_matrix.sql	1301018830	postgres	2026-08-24 15:10:18.10082	27	t
24	23	add details to audit logs	SQL	V23__add_details_to_audit_logs.sql	245440466	postgres	2026-08-24 15:11:49.417619	8	t
25	24	create piece production logs	SQL	V24__create_piece_production_logs.sql	1686764740	postgres	2026-08-24 16:47:10.913583	164	t
26	25	add standard smv to operations	SQL	V25__add_standard_smv_to_operations.sql	154058156	postgres	2026-08-25 10:51:14.728789	57	t
27	26	create hourly production entries	SQL	V26__create_hourly_production_entries.sql	302625009	postgres	2026-08-25 10:51:14.966559	104	t
28	27	relax bulletin line nullable in line plans	SQL	V27__relax_bulletin_line_nullable_in_line_plans.sql	-298792307	postgres	2026-08-25 11:05:06.073085	32	t
29	28	seed line balancing sample dataset	SQL	V28__seed_line_balancing_sample_dataset.sql	645660662	postgres	2026-08-25 12:06:00.968878	107	t
30	29	create sewing lines	SQL	V29__create_sewing_lines.sql	2038873566	postgres	2026-08-26 17:32:08.449042	104	t
31	30	create machines	SQL	V30__create_machines.sql	363737522	postgres	2026-08-26 17:32:08.634993	43	t
32	31	add breaks to shifts	SQL	V31__add_breaks_to_shifts.sql	1268805801	postgres	2026-08-26 17:32:08.696086	29	t
33	32	add role to operators	SQL	V32__add_role_to_operators.sql	362733384	postgres	2026-08-26 17:32:08.740488	15	t
34	33	add line and qc to line plans	SQL	V33__add_line_and_qc_to_line_plans.sql	2112960419	postgres	2026-08-26 17:32:08.774454	51	t
35	34	update sewing lines columns	SQL	V34__update_sewing_lines_columns.sql	-1790691457	postgres	2026-08-27 16:35:46.663499	19	t
36	35	add machine type to operations	SQL	V35__add_machine_type_to_operations.sql	-153325666	postgres	2026-09-01 10:12:30.501275	49	t
37	36	seed comprehensive skill matrix	SQL	V36__seed_comprehensive_skill_matrix.sql	1434904150	postgres	2026-09-01 11:39:48.769776	60	t
38	37	create notifications	SQL	V37__create_notifications.sql	2114960597	postgres	2026-09-02 09:33:11.684416	128	t
40	39	cascade delete order line plans	SQL	V39__cascade_delete_order_line_plans.sql	-932859114	postgres	2026-09-03 17:38:03.356178	124	t
43	42	seed complete 50 operators skill matrix	SQL	V42__seed_complete_50_operators_skill_matrix.sql	-1563167117	postgres	2026-09-08 15:05:33.574685	82	t
44	43	clean duplicate operators keep only 50	SQL	V43__clean_duplicate_operators_keep_only_50.sql	-1077133989	postgres	2026-09-09 10:09:01.41633	105	t
45	44	create operation affinities	SQL	V44__create_operation_affinities.sql	315133438	postgres	2026-09-10 11:48:08.78619	142	t
39	38	add planned completion date to orders	SQL	V38__add_planned_completion_date_to_orders.sql	-359247511	postgres	2026-09-02 11:48:10.404312	31	t
41	40	seed full production demo dataset	SQL	V40__seed_full_production_demo_dataset.sql	1113847551	postgres	2026-09-08 14:45:05.373827	163	t
42	41	standardize 50 operators sequential ids	SQL	V41__standardize_50_operators_sequential_ids.sql	-1550808092	postgres	2026-09-08 14:53:25.102035	95	t
46	45	seed natural comprehensive skill matrix	SQL	V45__seed_natural_comprehensive_skill_matrix.sql	761403733	postgres	2026-09-10 21:17:00.255179	116	t
47	46	reset affinity rating downgrades to zero	SQL	V46__reset_affinity_rating_downgrades_to_zero.sql	-751187301	postgres	2026-09-11 09:40:51.169678	12	t
48	47	add planned efficiency to line plans	SQL	V47__add_planned_efficiency_to_line_plans.sql	2011314267	postgres	2026-09-11 10:01:29.629425	100	t
49	48	enterprise line balancing schema	SQL	V48__enterprise_line_balancing_schema.sql	-931974522	postgres	2026-09-11 11:10:33.018311	377	t
50	49	add quantity to machines	SQL	V49__add_quantity_to_machines.sql	1516589171	postgres	2026-09-11 14:56:04.034379	91	t
51	50	create chatbot tables	SQL	V50__create_chatbot_tables.sql	228162750	postgres	2026-09-11 16:07:09.674811	130	t
52	51	add strategy allocations to line designs	SQL	V51__add_strategy_allocations_to_line_designs.sql	-1532695735	postgres	2026-09-12 13:36:52.589399	95	t
53	52	add wip threshold to bulletin lines	SQL	V52__add_wip_threshold_to_bulletin_lines.sql	-1979953084	postgres	2026-09-12 16:37:53.391727	42	t
\.


--
-- Data for Name: hourly_production_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hourly_production_entries (id, line_plan_id, operation_id, operator_id, log_date, shift_hour, hour_start_time, hour_end_time, target_qty, actual_qty, good_qty, reject_qty, sam_minutes, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: line_design_machines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.line_design_machines (id, line_design_id, machine_type, required_qty, available_qty, notes) FROM stdin;
15	12	4-Thread Overlock	5	2	Shortage of 3 units
16	12	Flatlock / Interlock	2	2	Available in factory inventory
17	12	Manual / Trim Station	2	0	Shortage of 2 units
18	12	Inspection Table	1	0	Shortage of 1 units
\.


--
-- Data for Name: line_designs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.line_designs (id, design_code, capacity_plan_id, order_id, bulletin_id, line_id, shift_id, total_workstations, total_operators, total_helpers, total_qc, total_machines, target_hourly_output, planned_efficiency, designed_pitch_secs, line_balance_efficiency, status, version, created_by, approved_by, released_by, created_at, updated_at, strategy_name, station_allocations, workstations_json) FROM stdin;
12	LD-CAP-PO-2026-004-9921-RECOMMENDED	7	17	11	1	1	10	10	2	1	10	81	85	37.78	72	DRAFT	1	\N	\N	\N	2026-09-12 15:02:55.401023	2026-09-12 15:28:13.217834	recommended	[{"bulletinLineId":49,"operationId":1,"operatorId":69,"isQcCheckpoint":false},{"bulletinLineId":50,"operationId":4,"operatorId":70,"isQcCheckpoint":false},{"bulletinLineId":50,"operationId":4,"operatorId":72,"isQcCheckpoint":false},{"bulletinLineId":51,"operationId":5,"operatorId":74,"isQcCheckpoint":false},{"bulletinLineId":52,"operationId":6,"operatorId":73,"isQcCheckpoint":false},{"bulletinLineId":53,"operationId":7,"operatorId":75,"isQcCheckpoint":false},{"bulletinLineId":53,"operationId":7,"operatorId":76,"isQcCheckpoint":false},{"bulletinLineId":54,"operationId":10,"operatorId":81,"isQcCheckpoint":false},{"bulletinLineId":55,"operationId":11,"operatorId":82,"isQcCheckpoint":false},{"bulletinLineId":56,"operationId":12,"operatorId":77,"isQcCheckpoint":false}]	[{"stationNum":1,"bulletinLineId":49,"operationId":1,"operationCode":"OP-001","operationName":"Shoulder Join","machineType":"4-Thread Overlock","smvSeconds":24,"operatorIds":[69],"isQcCheckpoint":false,"requiredSkillRating":"3"},{"stationNum":2,"bulletinLineId":50,"operationId":4,"operationCode":"OP-004","operationName":"Sleeve Attach Left","machineType":"4-Thread Overlock","smvSeconds":45,"operatorIds":[70,72],"isQcCheckpoint":false,"requiredSkillRating":"3"},{"stationNum":3,"bulletinLineId":51,"operationId":5,"operationCode":"OP-005","operationName":"Sleeve Attach Right","machineType":"4-Thread Overlock","smvSeconds":25.2,"operatorIds":[74],"isQcCheckpoint":false,"requiredSkillRating":"5"},{"stationNum":4,"bulletinLineId":52,"operationId":6,"operationCode":"OP-006","operationName":"Side Seam Close","machineType":"4-Thread Overlock","smvSeconds":30,"operatorIds":[73],"isQcCheckpoint":false,"requiredSkillRating":"4"},{"stationNum":5,"bulletinLineId":53,"operationId":7,"operationCode":"OP-007","operationName":"Bottom Hem","machineType":"Flatlock / Interlock","smvSeconds":72,"operatorIds":[75,76],"isQcCheckpoint":false,"requiredSkillRating":"4"},{"stationNum":6,"bulletinLineId":54,"operationId":10,"operationCode":"OP-010","operationName":"Trim Check","machineType":"Manual / Trim Station","smvSeconds":21,"operatorIds":[81],"isQcCheckpoint":false,"requiredSkillRating":"5"},{"stationNum":7,"bulletinLineId":55,"operationId":11,"operationCode":"OP-011","operationName":"Thread Trimming","machineType":"Manual / Trim Station","smvSeconds":21,"operatorIds":[82],"isQcCheckpoint":false,"requiredSkillRating":"5"},{"stationNum":8,"bulletinLineId":56,"operationId":12,"operationCode":"OP-012","operationName":"Initial Inspection","machineType":"Inspection Table","smvSeconds":21,"operatorIds":[77],"isQcCheckpoint":false,"requiredSkillRating":"5"}]
\.


--
-- Data for Name: line_plan_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.line_plan_assignments (id, line_plan_id, bulletin_line_id, operation_id, operator_id, created_at, updated_at, is_qc_checkpoint) FROM stdin;
33	6	26	1	97	2026-09-12 11:44:06.734363	2026-09-12 11:44:06.734363	f
34	6	27	2	71	2026-09-12 11:44:06.742268	2026-09-12 11:44:06.742268	f
35	6	28	3	79	2026-09-12 11:44:06.743832	2026-09-12 11:44:06.743832	f
36	6	29	9	99	2026-09-12 11:44:06.746346	2026-09-12 11:44:06.746346	f
38	5	\N	1	\N	2026-09-12 15:25:47.702297	2026-09-12 15:25:47.702297	f
39	7	49	1	69	2026-09-12 15:28:13.094013	2026-09-12 15:28:13.094013	f
40	7	50	4	70	2026-09-12 15:28:13.098262	2026-09-12 15:28:13.098262	f
41	7	50	4	72	2026-09-12 15:28:13.106288	2026-09-12 15:28:13.106288	f
42	7	51	5	74	2026-09-12 15:28:13.106978	2026-09-12 15:28:13.106978	f
43	7	52	6	73	2026-09-12 15:28:13.106978	2026-09-12 15:28:13.106978	f
44	7	53	7	75	2026-09-12 15:28:13.117741	2026-09-12 15:28:13.117741	f
45	7	53	7	76	2026-09-12 15:28:13.117741	2026-09-12 15:28:13.117741	f
46	7	54	10	81	2026-09-12 15:28:13.117741	2026-09-12 15:28:13.117741	f
47	7	55	11	82	2026-09-12 15:28:13.134603	2026-09-12 15:28:13.134603	f
48	7	56	12	77	2026-09-12 15:28:13.134603	2026-09-12 15:28:13.134603	f
\.


--
-- Data for Name: line_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.line_plans (id, order_id, shift_id, target_output, allowance, status, created_at, updated_at, line_id, allowance_pfd, planned_efficiency) FROM stdin;
4	5	2	229	10	active	2026-08-25 12:34:23.377886	2026-09-11 10:13:13.726166	1	5,4,1	80
6	9	1	12000	10	active	2026-09-12 11:44:06.705044	2026-09-12 11:44:06.705044	\N	5,4,1	80
5	16	1	500	0	active	2026-09-10 10:34:25.486244	2026-09-12 15:23:16.869566	1	5,4,1	80
7	17	1	648	0	active	2026-09-12 15:28:13.087906	2026-09-12 15:28:13.087906	1	5,4,1	85
\.


--
-- Data for Name: machines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.machines (id, machine_code, machine_type, brand, model, serial_no, line_id, status, active, created_at, updated_at, quantity) FROM stdin;
1	SN-001	Single Needle Lockstitch	Juki	DDL-8700	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
2	SN-002	Single Needle Lockstitch	Juki	DDL-9000C	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
3	SN-003	Single Needle Lockstitch	Brother	S-7300A	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
4	SN-004	Single Needle Lockstitch	Jack	A4F	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
5	OL-001	4-Thread Overlock	Pegasus	M952-52	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
6	OL-002	4-Thread Overlock	Siruba	747K	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
7	OL-003	5-Thread Overlock	Juki	MO-6816S	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
8	FL-001	Flatlock / Interlock	Yamato	VG2700	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
9	FL-002	Flatlock / Interlock	Pegasus	W562PV	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
10	BH-001	Buttonhole Machine	Juki	LBH-1790A	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
11	BA-001	Button Attach Machine	Juki	MB-1377	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
12	BT-001	Bar Tack Machine	Brother	KE-430FX	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
13	FOA-001	Feed-off-the-arm Machine	Juki	MS-1261	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
14	DN-001	Double Needle Lockstitch	Juki	LH-3568A	\N	\N	AVAILABLE	t	2026-08-26 17:32:08.647409	2026-08-26 17:32:08.647409	1
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, severity, recipient_role, operator_id, shift_id, reference_id, is_read, read_at, created_at, updated_at) FROM stdin;
46	Bottleneck Alert · LINE-01 · Line 01 - Polo & T-Shirt	PO-2026-004 · 1 station(s) exceed Takt (44.1s): #5 Bottom Hem (72.0s, Cap: 50 pcs/hr)	BOTTLENECK_ALERT	CRITICAL	MANAGER	\N	\N	17	f	\N	2026-09-12 12:14:39.374225	2026-09-12 14:58:53.426105
47	Bottleneck Alert · Line 1 · Main Assembly	ORD-TEST-999 · 1 bottleneck station(s) (Takt: 28.5s): #2 Attach Collar (WIP Overflow: 38 pcs in queue > 15 limit; Cap: 45 pcs/hr)	BOTTLENECK_ALERT	CRITICAL	MANAGER	\N	\N	99999	f	\N	2026-09-12 16:35:02.166098	2026-09-12 16:38:14.151854
44	Bottleneck Alert · LINE-01 · Line 01 - Polo & T-Shirt	PO-NIKE-POLO-800 · 2 station(s) exceed Takt (32.5s): #4 Sleeve Attach Left (45.0s, Cap: 80 pcs/hr); #5 Bottom Hem (72.0s, Cap: 50 pcs/hr)	BOTTLENECK_ALERT	CRITICAL	MANAGER	\N	\N	13	f	\N	2026-09-08 14:48:33.286553	2026-09-09 14:34:32.422886
43	Bottleneck Alert · LINE-01 · Line 01 - Polo & T-Shirt	PO-2026-003 · 4 station(s) exceed Takt (1.9s): #1 Shoulder Join (24.0s, Cap: 150 pcs/hr); #2 Neck Rib Attach (39.0s, Cap: 92 pcs/hr); #3 Neck Top Stitch (21.0s, Cap: 171 pcs/hr); #4 Label Attach (21.0s, Cap: 171 pcs/hr)	BOTTLENECK_ALERT	CRITICAL	MANAGER	\N	\N	9	f	\N	2026-09-03 17:45:31.815344	2026-09-12 10:20:15.854371
7	Bottleneck Alert · LINE-01 · Line 01 - Polo & T-Shirt	PO-2026-002 · 3 station(s) exceed Takt (42.5s): #2 Sleeve Attach Left (45.0s, Cap: 80 pcs/hr); #4 Bottom Hem (72.0s, Cap: 50 pcs/hr); #5 Neck Rib Attach (39.0s, Cap: 92 pcs/hr)	BOTTLENECK_ALERT	CRITICAL	MANAGER	\N	\N	5	f	\N	2026-09-02 12:26:56.433904	2026-09-12 10:20:33.187031
45	Bottleneck Alert · LINE-01 · Line 01 - Polo & T-Shirt	PO-UNIQLO-DENIM-900 · 6 station(s) exceed Takt (16.6s): #1 Shoulder Join (24.0s, Cap: 150 pcs/hr); #2 Neck Rib Attach (25.2s, Cap: 143 pcs/hr); #3 Neck Top Stitch (21.0s, Cap: 171 pcs/hr); #4 Sleeve Attach Left (32.1s, Cap: 112 pcs/hr); #5 Sleeve Attach Right (29.6s, Cap: 122 pcs/hr); #6 Side Seam Close (42.9s, Cap: 84 pcs/hr)	BOTTLENECK_ALERT	CRITICAL	MANAGER	\N	\N	16	f	\N	2026-09-09 12:37:08.45578	2026-09-12 11:35:27.239659
\.


--
-- Data for Name: operation_affinities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operation_affinities (id, primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes, created_at, updated_at) FROM stdin;
1	4	5	DIRECT_SUBSTITUTE	95.00	0	t	Identical 4-Thread Overlock machine and curved armhole joining seam technique	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
2	5	4	DIRECT_SUBSTITUTE	95.00	0	t	Identical 4-Thread Overlock machine and curved armhole joining seam technique	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
3	7	8	DIRECT_SUBSTITUTE	95.00	0	t	Flatlock / Interlock circular hem folder operation	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
4	8	7	DIRECT_SUBSTITUTE	95.00	0	t	Flatlock / Interlock circular hem folder operation	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
5	1	6	SIMILAR_TECHNIQUE	85.00	0	t	Both use 4-Thread Overlock joining seam, straight run	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
6	6	1	SIMILAR_TECHNIQUE	85.00	0	t	Both use 4-Thread Overlock joining seam, straight run	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
7	2	1	SIMILAR_TECHNIQUE	80.00	0	t	Overlock elasticated rib insertion vs plain overlock seam	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
8	3	9	SIMILAR_TECHNIQUE	85.00	0	t	Single Needle Lockstitch precision edge guidance	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
9	9	3	SIMILAR_TECHNIQUE	85.00	0	t	Single Needle Lockstitch precision edge guidance	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
10	10	11	DIRECT_SUBSTITUTE	95.00	0	t	Manual trim and clean workstation	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
11	11	10	DIRECT_SUBSTITUTE	95.00	0	t	Manual trim and clean workstation	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
12	12	15	DIRECT_SUBSTITUTE	95.00	0	t	Visual and measurement QC inspection bench	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
13	15	12	DIRECT_SUBSTITUTE	95.00	0	t	Visual and measurement QC inspection bench	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
14	16	17	SIMILAR_TECHNIQUE	85.00	0	t	Garment finishing and presentation packing line	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
15	17	18	DIRECT_SUBSTITUTE	90.00	0	t	End-of-line packaging dispatch	2026-09-10 11:48:09.103213	2026-09-10 11:48:09.103213
16	2	4	DIRECT_SUBSTITUTE	95.00	0	t	\N	2026-09-10 12:53:47.520234	2026-09-10 12:53:47.520234
17	4	2	DIRECT_SUBSTITUTE	95.00	0	t	\N	2026-09-10 12:53:47.552777	2026-09-10 12:53:47.552777
\.


--
-- Data for Name: operation_bulletins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operation_bulletins (id, bulletin_code, name, description, version, status, effective_from, effective_to, total_smv, created_at, updated_at, revision_number, parent_bulletin_id, approved_by, approved_at, released_by, released_at) FROM stdin;
3	OB-TS-480	Standard T-Shirt Bulletin (480 Shift Target)	Benchmark operation sequence for 480 pcs/shift balancing	1	PUBLISHED	\N	\N	3.5000	2026-08-25 12:06:01.025026	2026-08-25 12:06:01.025026	1	\N	\N	\N	\N	\N
7	OB-481	men's shirts		1	PUBLISHED	\N	\N	1.7500	2026-09-03 18:16:04.010804	2026-09-03 18:28:15.002097	1	\N	\N	\N	\N	\N
8	OB-POLO-800	Nike Dri-FIT Polo Standard Operation Bulletin	Benchmark high-efficiency operation sequence for polo production	1	PUBLISHED	\N	\N	4.2500	2026-09-08 14:45:05.455252	2026-09-08 14:45:05.455252	1	\N	\N	\N	\N	\N
10	OB-801	 Uniqlo LifeWear bulletin		1	PUBLISHED	\N	\N	3.0700	2026-09-09 12:41:03.188889	2026-09-10 17:16:33.521086	1	\N	\N	\N	\N	\N
11	OB-802	teamspirit bulletin		1	PUBLISHED	\N	\N	4.3200	2026-09-12 12:12:15.642042	2026-09-12 12:40:52.142356	1	\N	\N	\N	Plant IE Head	2026-09-12 12:12:21.490009
\.


--
-- Data for Name: operations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operations (id, operation_code, name, description, sequence, active, created_at, updated_at, standard_smv, machine_type) FROM stdin;
3	OP-003	Neck Top Stitch	Top stitch around the neck rib for a clean finish	3	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Single Needle Lockstitch
5	OP-005	Sleeve Attach Right	Attach the right sleeve to the armhole	5	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.4200	4-Thread Overlock
8	OP-008	Sleeve Hem	Hem the sleeve cuff edge	8	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.4200	Flatlock / Interlock
9	OP-009	Label Attach	Attach the brand/care label inside the garment	9	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Single Needle Lockstitch
10	OP-010	Trim Check	Check and trim all visible loose threads	10	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Manual / Trim Station
11	OP-011	Thread Trimming	Trim remaining thread tails across the garment	11	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Manual / Trim Station
12	OP-012	Initial Inspection	First quality inspection of the sewn garment	12	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Inspection Table
13	OP-013	Spot Cleaning	Remove any stains or marks from the garment surface	13	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Cleaning Gun / Station
14	OP-014	Final Measurement	Measure the garment against the size specification	14	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Measurement Table
15	OP-015	Final Inspection	Final quality check before packing	15	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Inspection Table
16	OP-016	Folding	Fold the garment to the specified presentation format	16	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Manual / Folding Table
17	OP-017	Poly Bag Packing	Insert the folded garment into a poly bag	17	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.3500	Manual / Packing Table
18	OP-018	Carton Packing	Pack poly-bagged garments into export cartons	18	t	2026-08-21 13:55:46.957861	2026-08-22 12:48:06.175829	0.3500	Manual / Carton Station
6	OP-006	Side Seam Close	Close the side seam from underarm to hem	6	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.5000	4-Thread Overlock
7	OP-007	Bottom Hem	Hem the bottom edge of the garment	7	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	1.2000	Flatlock / Interlock
2	OP-002	Neck Rib Attach	Attach the neck rib/ribbing to the neckline	2	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.6500	4-Thread Overlock
4	OP-004	Sleeve Attach Left	Attach the left sleeve to the armhole	4	t	2026-08-21 13:55:46.957861	2026-08-21 13:55:46.957861	0.7500	4-Thread Overlock
1	OP-001	Shoulder Join	Join the front and back shoulder seams together	1	t	2026-08-21 13:55:46.957861	2026-08-26 10:32:45.24091	0.4000	4-Thread Overlock
\.


--
-- Data for Name: operator_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operator_attachments (id, operator_id, file_name, file_type, data, uploaded_at) FROM stdin;
\.


--
-- Data for Name: operator_performance_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operator_performance_logs (id, operator_id, operation_id, log_date, actual_cycle_time_seconds, recorded_by, notes, created_at, updated_at, status) FROM stdin;
51	72	1	2026-09-02	27	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:31.905442	2026-09-10 16:45:31.905442	SUBMITTED
52	72	2	2026-08-28	40	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:31.911723	2026-09-10 16:45:31.911723	SUBMITTED
53	72	2	2026-09-02	38	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:31.920671	2026-09-10 16:45:31.920671	SUBMITTED
26	69	1	2026-09-08	25	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:31.653354	2026-09-10 16:45:31.653354	SUBMITTED
27	69	1	2026-08-01	23	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:31.684473	2026-09-10 16:45:31.684473	SUBMITTED
28	69	2	2026-09-08	40	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:31.691824	2026-09-10 16:45:31.691824	SUBMITTED
29	69	2	2026-08-01	38	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:31.699639	2026-09-10 16:45:31.699639	SUBMITTED
30	69	3	2026-09-08	26	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:31.709402	2026-09-10 16:45:31.709402	SUBMITTED
31	69	3	2026-08-01	24	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:31.718923	2026-09-10 16:45:31.718923	SUBMITTED
32	69	4	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:31.726204	2026-09-10 16:45:31.726204	SUBMITTED
33	69	4	2026-08-01	52	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:31.740179	2026-09-10 16:45:31.740179	SUBMITTED
34	70	1	2026-08-01	30	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:31.754614	2026-09-10 16:45:31.754614	SUBMITTED
35	70	1	2026-08-15	28	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:31.775953	2026-09-10 16:45:31.775953	SUBMITTED
36	70	2	2026-08-01	40	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:31.785847	2026-09-10 16:45:31.785847	SUBMITTED
37	70	2	2026-08-15	38	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:31.792279	2026-09-10 16:45:31.792279	SUBMITTED
38	70	3	2026-08-01	22	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:31.801888	2026-09-10 16:45:31.801888	SUBMITTED
39	70	3	2026-08-15	20	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:31.808091	2026-09-10 16:45:31.808091	SUBMITTED
40	70	4	2026-08-01	55	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:31.815964	2026-09-10 16:45:31.815964	SUBMITTED
41	70	4	2026-08-15	53	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:31.824252	2026-09-10 16:45:31.824252	SUBMITTED
42	71	1	2026-08-15	29	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:31.833113	2026-09-10 16:45:31.833113	SUBMITTED
43	71	1	2026-08-28	27	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:31.840901	2026-09-10 16:45:31.840901	SUBMITTED
44	71	2	2026-08-15	40	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:31.851091	2026-09-10 16:45:31.851091	SUBMITTED
45	71	2	2026-08-28	38	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:31.859486	2026-09-10 16:45:31.859486	SUBMITTED
46	71	3	2026-08-15	31	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:31.869345	2026-09-10 16:45:31.869345	SUBMITTED
47	71	3	2026-08-28	29	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:31.874088	2026-09-10 16:45:31.874088	SUBMITTED
48	71	4	2026-08-15	45	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:31.88355	2026-09-10 16:45:31.88355	SUBMITTED
49	71	4	2026-08-28	43	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:31.88989	2026-09-10 16:45:31.88989	SUBMITTED
50	72	1	2026-08-28	29	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:31.89723	2026-09-10 16:45:31.89723	SUBMITTED
54	72	3	2026-08-28	26	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:31.928659	2026-09-10 16:45:31.928659	SUBMITTED
55	72	3	2026-09-02	24	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:31.938046	2026-09-10 16:45:31.938046	SUBMITTED
56	72	4	2026-08-28	46	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:31.946051	2026-09-10 16:45:31.946051	SUBMITTED
57	72	4	2026-09-02	44	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:31.953825	2026-09-10 16:45:31.953825	SUBMITTED
58	73	1	2026-09-02	26	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:31.964382	2026-09-10 16:45:31.964382	SUBMITTED
59	73	1	2026-09-08	24	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:31.972542	2026-09-10 16:45:31.972542	SUBMITTED
60	73	2	2026-09-02	40	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:31.980625	2026-09-10 16:45:31.980625	SUBMITTED
61	73	2	2026-09-08	38	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:31.989699	2026-09-10 16:45:31.989699	SUBMITTED
62	73	3	2026-09-02	26	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:31.999087	2026-09-10 16:45:31.999087	SUBMITTED
63	73	3	2026-09-08	24	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.006905	2026-09-10 16:45:32.006905	SUBMITTED
64	73	4	2026-09-02	46	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.017724	2026-09-10 16:45:32.017724	SUBMITTED
65	73	4	2026-09-08	44	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.026231	2026-09-10 16:45:32.026231	SUBMITTED
66	74	1	2026-09-08	22	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.033807	2026-09-10 16:45:32.033807	SUBMITTED
67	74	1	2026-08-01	20	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.040313	2026-09-10 16:45:32.040313	SUBMITTED
68	74	2	2026-09-08	40	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.048021	2026-09-10 16:45:32.048021	SUBMITTED
69	74	2	2026-08-01	38	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.05609	2026-09-10 16:45:32.05609	SUBMITTED
70	74	3	2026-09-08	19	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.064366	2026-09-10 16:45:32.064366	SUBMITTED
71	74	3	2026-08-01	17	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.072287	2026-09-10 16:45:32.072287	SUBMITTED
73	74	4	2026-08-01	37	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.12109	2026-09-10 16:45:32.12109	SUBMITTED
76	75	2	2026-08-01	56	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.186319	2026-09-10 16:45:32.186319	SUBMITTED
77	75	2	2026-08-15	54	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.21419	2026-09-10 16:45:32.21419	SUBMITTED
78	75	3	2026-08-01	19	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.254477	2026-09-10 16:45:32.254477	SUBMITTED
79	75	3	2026-08-15	17	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.276867	2026-09-10 16:45:32.276867	SUBMITTED
80	75	4	2026-08-01	54	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.293912	2026-09-10 16:45:32.293912	SUBMITTED
81	75	4	2026-08-15	52	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.311098	2026-09-10 16:45:32.311098	SUBMITTED
82	76	1	2026-08-15	26	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.334361	2026-09-10 16:45:32.334361	SUBMITTED
84	76	2	2026-08-15	47	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.374911	2026-09-10 16:45:32.374911	SUBMITTED
87	76	3	2026-08-28	21	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.438234	2026-09-10 16:45:32.438234	SUBMITTED
88	76	4	2026-08-15	55	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.46095	2026-09-10 16:45:32.46095	SUBMITTED
89	76	4	2026-08-28	53	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.483196	2026-09-10 16:45:32.483196	SUBMITTED
90	77	1	2026-08-28	21	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.506176	2026-09-10 16:45:32.506176	SUBMITTED
91	77	1	2026-09-02	19	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.524024	2026-09-10 16:45:32.524024	SUBMITTED
92	77	2	2026-08-28	34	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.539276	2026-09-10 16:45:32.539276	SUBMITTED
94	77	3	2026-08-28	19	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.570842	2026-09-10 16:45:32.570842	SUBMITTED
97	77	4	2026-09-02	43	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.635526	2026-09-10 16:45:32.635526	SUBMITTED
98	78	1	2026-09-02	30	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.651709	2026-09-10 16:45:32.651709	SUBMITTED
99	78	1	2026-09-08	28	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.667768	2026-09-10 16:45:32.667768	SUBMITTED
100	78	2	2026-09-02	56	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.685706	2026-09-10 16:45:32.685706	SUBMITTED
101	78	2	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.700595	2026-09-10 16:45:32.700595	SUBMITTED
102	78	3	2026-09-02	20	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.714308	2026-09-10 16:45:32.714308	SUBMITTED
104	78	4	2026-09-02	54	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.741599	2026-09-10 16:45:32.741599	SUBMITTED
107	79	1	2026-08-01	27	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.783011	2026-09-10 16:45:32.783011	SUBMITTED
108	79	2	2026-09-08	47	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.79382	2026-09-10 16:45:32.79382	SUBMITTED
109	79	2	2026-08-01	45	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.808981	2026-09-10 16:45:32.808981	SUBMITTED
110	79	3	2026-09-08	22	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.822341	2026-09-10 16:45:32.822341	SUBMITTED
111	79	3	2026-08-01	20	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.837704	2026-09-10 16:45:32.837704	SUBMITTED
112	79	4	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.852182	2026-09-10 16:45:32.852182	SUBMITTED
114	80	1	2026-08-01	45	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.887378	2026-09-10 16:45:32.887378	SUBMITTED
117	80	2	2026-08-15	68	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.930384	2026-09-10 16:45:32.930384	SUBMITTED
118	80	3	2026-08-01	38	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.942545	2026-09-10 16:45:32.942545	SUBMITTED
119	80	3	2026-08-15	36	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.956651	2026-09-10 16:45:32.956651	SUBMITTED
120	80	4	2026-08-01	81	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.969325	2026-09-10 16:45:32.969325	SUBMITTED
121	80	4	2026-08-15	79	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.985485	2026-09-10 16:45:32.985485	SUBMITTED
122	81	1	2026-08-15	30	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.995713	2026-09-10 16:45:32.995713	SUBMITTED
124	81	2	2026-08-15	47	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.023877	2026-09-10 16:45:33.023877	SUBMITTED
127	81	3	2026-08-28	29	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.070013	2026-09-10 16:45:33.070013	SUBMITTED
128	81	4	2026-08-15	66	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.085387	2026-09-10 16:45:33.085387	SUBMITTED
129	81	4	2026-08-28	64	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.100788	2026-09-10 16:45:33.100788	SUBMITTED
130	82	1	2026-08-28	22	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.117048	2026-09-10 16:45:33.117048	SUBMITTED
131	82	1	2026-09-02	20	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.130216	2026-09-10 16:45:33.130216	SUBMITTED
132	82	2	2026-08-28	40	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.144211	2026-09-10 16:45:33.144211	SUBMITTED
134	82	3	2026-08-28	19	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.174641	2026-09-10 16:45:33.174641	SUBMITTED
72	74	4	2026-09-08	39	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.088511	2026-09-10 16:45:32.088511	SUBMITTED
75	75	1	2026-08-15	34	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.156437	2026-09-10 16:45:32.156437	SUBMITTED
83	76	1	2026-08-28	24	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.356035	2026-09-10 16:45:32.356035	SUBMITTED
86	76	3	2026-08-15	23	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:32.418763	2026-09-10 16:45:32.418763	SUBMITTED
93	77	2	2026-09-02	32	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.555479	2026-09-10 16:45:32.555479	SUBMITTED
96	77	4	2026-08-28	45	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:32.617981	2026-09-10 16:45:32.617981	SUBMITTED
103	78	3	2026-09-08	18	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.728055	2026-09-10 16:45:32.728055	SUBMITTED
106	79	1	2026-09-08	29	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.770528	2026-09-10 16:45:32.770528	SUBMITTED
113	79	4	2026-08-01	52	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.869367	2026-09-10 16:45:32.869367	SUBMITTED
116	80	2	2026-08-01	70	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:32.918591	2026-09-10 16:45:32.918591	SUBMITTED
123	81	1	2026-08-28	28	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.009333	2026-09-10 16:45:33.009333	SUBMITTED
126	81	3	2026-08-15	31	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.052422	2026-09-10 16:45:33.052422	SUBMITTED
133	82	2	2026-09-02	38	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.16008	2026-09-10 16:45:33.16008	SUBMITTED
136	82	4	2026-08-28	46	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.203278	2026-09-10 16:45:33.203278	SUBMITTED
143	83	3	2026-09-08	24	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.307662	2026-09-10 16:45:33.307662	SUBMITTED
146	84	1	2026-09-08	36	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.366041	2026-09-10 16:45:33.366041	SUBMITTED
153	84	4	2026-08-01	52	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.49157	2026-09-10 16:45:33.49157	SUBMITTED
156	85	2	2026-08-01	33	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.555069	2026-09-10 16:45:33.555069	SUBMITTED
163	86	1	2026-08-28	23	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.641009	2026-09-10 16:45:33.641009	SUBMITTED
166	86	3	2026-08-15	22	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.682822	2026-09-10 16:45:33.682822	SUBMITTED
173	87	2	2026-09-02	45	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.765813	2026-09-10 16:45:33.765813	SUBMITTED
176	87	4	2026-08-28	65	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.805332	2026-09-10 16:45:33.805332	SUBMITTED
183	88	3	2026-09-08	37	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.916456	2026-09-10 16:45:33.916456	SUBMITTED
186	89	1	2026-09-08	30	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.964776	2026-09-10 16:45:33.964776	SUBMITTED
193	89	4	2026-08-01	52	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.065432	2026-09-10 16:45:34.065432	SUBMITTED
196	90	2	2026-08-01	57	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.104009	2026-09-10 16:45:34.104009	SUBMITTED
203	91	1	2026-08-28	28	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.202413	2026-09-10 16:45:34.202413	SUBMITTED
206	91	3	2026-08-15	32	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.24881	2026-09-10 16:45:34.24881	SUBMITTED
213	92	2	2026-09-02	46	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.334804	2026-09-10 16:45:34.334804	SUBMITTED
216	92	4	2026-08-28	54	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.373995	2026-09-10 16:45:34.373995	SUBMITTED
223	93	3	2026-09-08	21	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.482574	2026-09-10 16:45:34.482574	SUBMITTED
226	94	1	2026-09-08	36	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.522033	2026-09-10 16:45:34.522033	SUBMITTED
233	94	4	2026-08-01	62	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.628241	2026-09-10 16:45:34.628241	SUBMITTED
236	95	2	2026-08-01	47	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.683139	2026-09-10 16:45:34.683139	SUBMITTED
243	96	1	2026-08-28	41	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.774813	2026-09-10 16:45:34.774813	SUBMITTED
246	96	3	2026-08-15	39	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.825035	2026-09-10 16:45:34.825035	SUBMITTED
253	97	2	2026-09-02	32	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.93236	2026-09-10 16:45:34.93236	SUBMITTED
256	97	4	2026-08-28	38	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.975902	2026-09-10 16:45:34.975902	SUBMITTED
263	98	3	2026-09-08	29	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.10831	2026-09-10 16:45:35.10831	SUBMITTED
266	99	1	2026-09-08	26	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.156615	2026-09-10 16:45:35.156615	SUBMITTED
273	99	4	2026-08-01	52	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.269394	2026-09-10 16:45:35.269394	SUBMITTED
276	100	2	2026-08-01	57	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.309043	2026-09-10 16:45:35.309043	SUBMITTED
283	101	1	2026-08-28	23	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.422064	2026-09-10 16:45:35.422064	SUBMITTED
286	101	3	2026-08-15	22	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.466475	2026-09-10 16:45:35.466475	SUBMITTED
293	102	2	2026-09-02	68	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.571963	2026-09-10 16:45:35.571963	SUBMITTED
331	107	1	2026-09-02	28	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.318068	2026-09-10 16:45:36.318068	SUBMITTED
74	75	1	2026-08-01	36	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:32.134108	2026-09-10 16:45:32.134108	SUBMITTED
85	76	2	2026-08-28	45	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:32.395719	2026-09-10 16:45:32.395719	SUBMITTED
95	77	3	2026-09-02	17	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:32.598008	2026-09-10 16:45:32.598008	SUBMITTED
105	78	4	2026-09-08	52	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:32.757208	2026-09-10 16:45:32.757208	SUBMITTED
115	80	1	2026-08-15	43	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:32.904464	2026-09-10 16:45:32.904464	SUBMITTED
125	81	2	2026-08-28	45	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.037378	2026-09-10 16:45:33.037378	SUBMITTED
135	82	3	2026-09-02	17	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.188985	2026-09-10 16:45:33.188985	SUBMITTED
145	83	4	2026-09-08	52	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.352153	2026-09-10 16:45:33.352153	SUBMITTED
155	85	1	2026-08-15	19	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.537859	2026-09-10 16:45:33.537859	SUBMITTED
165	86	2	2026-08-28	32	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.671442	2026-09-10 16:45:33.671442	SUBMITTED
175	87	3	2026-09-02	20	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.789146	2026-09-10 16:45:33.789146	SUBMITTED
185	88	4	2026-09-08	79	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.950191	2026-09-10 16:45:33.950191	SUBMITTED
195	90	1	2026-08-15	42	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.093189	2026-09-10 16:45:34.093189	SUBMITTED
205	91	2	2026-08-28	46	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.230126	2026-09-10 16:45:34.230126	SUBMITTED
215	92	3	2026-09-02	25	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.362408	2026-09-10 16:45:34.362408	SUBMITTED
225	93	4	2026-09-08	63	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.509526	2026-09-10 16:45:34.509526	SUBMITTED
235	95	1	2026-08-15	28	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.666875	2026-09-10 16:45:34.666875	SUBMITTED
245	96	2	2026-08-28	68	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.808992	2026-09-10 16:45:34.808992	SUBMITTED
255	97	3	2026-09-02	17	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.960456	2026-09-10 16:45:34.960456	SUBMITTED
265	98	4	2026-09-08	64	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.13996	2026-09-10 16:45:35.13996	SUBMITTED
275	100	1	2026-08-15	34	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.294289	2026-09-10 16:45:35.294289	SUBMITTED
285	101	2	2026-08-28	32	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.454062	2026-09-10 16:45:35.454062	SUBMITTED
295	102	3	2026-09-02	37	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.607809	2026-09-10 16:45:35.607809	SUBMITTED
305	103	4	2026-09-08	45	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.786235	2026-09-10 16:45:35.786235	SUBMITTED
316	105	2	2026-08-01	48	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.022013	2026-09-10 16:45:36.022013	SUBMITTED
326	106	3	2026-08-15	39	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.234905	2026-09-10 16:45:36.234905	SUBMITTED
336	107	4	2026-08-28	47	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.402658	2026-09-10 16:45:36.402658	SUBMITTED
346	109	1	2026-09-08	30	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.59285	2026-09-10 16:45:36.59285	SUBMITTED
356	110	2	2026-08-01	57	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.759917	2026-09-10 16:45:36.759917	SUBMITTED
366	111	3	2026-08-15	20	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.913202	2026-09-10 16:45:36.913202	SUBMITTED
376	112	4	2026-08-28	66	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.068167	2026-09-10 16:45:37.068167	SUBMITTED
386	114	1	2026-09-08	44	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:37.238364	2026-09-10 16:45:37.238364	SUBMITTED
396	115	2	2026-08-01	47	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:37.41307	2026-09-10 16:45:37.41307	SUBMITTED
406	116	3	2026-08-15	38	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.60647	2026-09-10 16:45:37.60647	SUBMITTED
416	117	4	2026-08-28	46	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.788191	2026-09-10 16:45:37.788191	SUBMITTED
137	82	4	2026-09-02	44	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.218223	2026-09-10 16:45:33.218223	SUBMITTED
138	83	1	2026-09-02	26	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.230685	2026-09-10 16:45:33.230685	SUBMITTED
139	83	1	2026-09-08	24	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.245167	2026-09-10 16:45:33.245167	SUBMITTED
140	83	2	2026-09-02	40	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.259648	2026-09-10 16:45:33.259648	SUBMITTED
141	83	2	2026-09-08	38	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.274773	2026-09-10 16:45:33.274773	SUBMITTED
142	83	3	2026-09-02	26	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.289801	2026-09-10 16:45:33.289801	SUBMITTED
144	83	4	2026-09-02	54	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.335908	2026-09-10 16:45:33.335908	SUBMITTED
147	84	1	2026-08-01	34	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.377805	2026-09-10 16:45:33.377805	SUBMITTED
148	84	2	2026-09-08	56	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.394795	2026-09-10 16:45:33.394795	SUBMITTED
149	84	2	2026-08-01	54	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.410629	2026-09-10 16:45:33.410629	SUBMITTED
150	84	3	2026-09-08	32	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.428736	2026-09-10 16:45:33.428736	SUBMITTED
151	84	3	2026-08-01	30	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.449529	2026-09-10 16:45:33.449529	SUBMITTED
152	84	4	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.466551	2026-09-10 16:45:33.466551	SUBMITTED
154	85	1	2026-08-01	21	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.520071	2026-09-10 16:45:33.520071	SUBMITTED
157	85	2	2026-08-15	31	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.569206	2026-09-10 16:45:33.569206	SUBMITTED
158	85	3	2026-08-01	19	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.582312	2026-09-10 16:45:33.582312	SUBMITTED
159	85	3	2026-08-15	17	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.593294	2026-09-10 16:45:33.593294	SUBMITTED
160	85	4	2026-08-01	39	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.605538	2026-09-10 16:45:33.605538	SUBMITTED
161	85	4	2026-08-15	37	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.619353	2026-09-10 16:45:33.619353	SUBMITTED
162	86	1	2026-08-15	25	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.629548	2026-09-10 16:45:33.629548	SUBMITTED
164	86	2	2026-08-15	34	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.657218	2026-09-10 16:45:33.657218	SUBMITTED
167	86	3	2026-08-28	20	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:33.690991	2026-09-10 16:45:33.690991	SUBMITTED
168	86	4	2026-08-15	39	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.70414	2026-09-10 16:45:33.70414	SUBMITTED
169	86	4	2026-08-28	37	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.7166	2026-09-10 16:45:33.7166	SUBMITTED
170	87	1	2026-08-28	30	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.72641	2026-09-10 16:45:33.72641	SUBMITTED
171	87	1	2026-09-02	28	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.738476	2026-09-10 16:45:33.738476	SUBMITTED
172	87	2	2026-08-28	47	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.753236	2026-09-10 16:45:33.753236	SUBMITTED
174	87	3	2026-08-28	22	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.776067	2026-09-10 16:45:33.776067	SUBMITTED
177	87	4	2026-09-02	63	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:33.819948	2026-09-10 16:45:33.819948	SUBMITTED
178	88	1	2026-09-02	36	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:33.83326	2026-09-10 16:45:33.83326	SUBMITTED
179	88	1	2026-09-08	34	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.848761	2026-09-10 16:45:33.848761	SUBMITTED
180	88	2	2026-09-02	71	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.863263	2026-09-10 16:45:33.863263	SUBMITTED
181	88	2	2026-09-08	69	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:33.878161	2026-09-10 16:45:33.878161	SUBMITTED
182	88	3	2026-09-02	39	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:33.896075	2026-09-10 16:45:33.896075	SUBMITTED
184	88	4	2026-09-02	81	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:33.932808	2026-09-10 16:45:33.932808	SUBMITTED
187	89	1	2026-08-01	28	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:33.979775	2026-09-10 16:45:33.979775	SUBMITTED
188	89	2	2026-09-08	41	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:33.993895	2026-09-10 16:45:33.993895	SUBMITTED
189	89	2	2026-08-01	39	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.008057	2026-09-10 16:45:34.008057	SUBMITTED
190	89	3	2026-09-08	32	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.021615	2026-09-10 16:45:34.021615	SUBMITTED
191	89	3	2026-08-01	30	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.039259	2026-09-10 16:45:34.039259	SUBMITTED
192	89	4	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.053798	2026-09-10 16:45:34.053798	SUBMITTED
194	90	1	2026-08-01	44	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.076071	2026-09-10 16:45:34.076071	SUBMITTED
197	90	2	2026-08-15	55	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.117281	2026-09-10 16:45:34.117281	SUBMITTED
198	90	3	2026-08-01	39	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.126568	2026-09-10 16:45:34.126568	SUBMITTED
199	90	3	2026-08-15	37	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.137674	2026-09-10 16:45:34.137674	SUBMITTED
200	90	4	2026-08-01	81	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.15797	2026-09-10 16:45:34.15797	SUBMITTED
201	90	4	2026-08-15	79	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.173905	2026-09-10 16:45:34.173905	SUBMITTED
202	91	1	2026-08-15	30	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.188086	2026-09-10 16:45:34.188086	SUBMITTED
204	91	2	2026-08-15	48	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.216816	2026-09-10 16:45:34.216816	SUBMITTED
207	91	3	2026-08-28	30	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.25954	2026-09-10 16:45:34.25954	SUBMITTED
208	91	4	2026-08-15	54	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.270633	2026-09-10 16:45:34.270633	SUBMITTED
209	91	4	2026-08-28	52	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.284748	2026-09-10 16:45:34.284748	SUBMITTED
210	92	1	2026-08-28	35	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.296158	2026-09-10 16:45:34.296158	SUBMITTED
211	92	1	2026-09-02	33	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.307938	2026-09-10 16:45:34.307938	SUBMITTED
212	92	2	2026-08-28	48	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.323162	2026-09-10 16:45:34.323162	SUBMITTED
214	92	3	2026-08-28	27	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.349131	2026-09-10 16:45:34.349131	SUBMITTED
217	92	4	2026-09-02	52	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.389398	2026-09-10 16:45:34.389398	SUBMITTED
218	93	1	2026-09-02	30	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.404004	2026-09-10 16:45:34.404004	SUBMITTED
219	93	1	2026-09-08	28	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.419536	2026-09-10 16:45:34.419536	SUBMITTED
220	93	2	2026-09-02	48	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.434931	2026-09-10 16:45:34.434931	SUBMITTED
221	93	2	2026-09-08	46	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.451083	2026-09-10 16:45:34.451083	SUBMITTED
222	93	3	2026-09-02	23	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.465843	2026-09-10 16:45:34.465843	SUBMITTED
224	93	4	2026-09-02	65	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.495372	2026-09-10 16:45:34.495372	SUBMITTED
227	94	1	2026-08-01	34	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.532311	2026-09-10 16:45:34.532311	SUBMITTED
228	94	2	2026-09-08	56	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.542059	2026-09-10 16:45:34.542059	SUBMITTED
229	94	2	2026-08-01	54	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.556392	2026-09-10 16:45:34.556392	SUBMITTED
230	94	3	2026-09-08	32	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.571167	2026-09-10 16:45:34.571167	SUBMITTED
231	94	3	2026-08-01	30	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.589138	2026-09-10 16:45:34.589138	SUBMITTED
232	94	4	2026-09-08	64	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.608299	2026-09-10 16:45:34.608299	SUBMITTED
234	95	1	2026-08-01	30	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.649297	2026-09-10 16:45:34.649297	SUBMITTED
237	95	2	2026-08-15	45	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:34.692208	2026-09-10 16:45:34.692208	SUBMITTED
238	95	3	2026-08-01	23	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.706225	2026-09-10 16:45:34.706225	SUBMITTED
239	95	3	2026-08-15	21	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.720247	2026-09-10 16:45:34.720247	SUBMITTED
240	95	4	2026-08-01	46	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.732334	2026-09-10 16:45:34.732334	SUBMITTED
241	95	4	2026-08-15	44	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.744095	2026-09-10 16:45:34.744095	SUBMITTED
242	96	1	2026-08-15	43	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.759568	2026-09-10 16:45:34.759568	SUBMITTED
244	96	2	2026-08-15	70	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.795223	2026-09-10 16:45:34.795223	SUBMITTED
247	96	3	2026-08-28	37	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:34.838211	2026-09-10 16:45:34.838211	SUBMITTED
248	96	4	2026-08-15	81	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:34.854429	2026-09-10 16:45:34.854429	SUBMITTED
249	96	4	2026-08-28	79	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.869173	2026-09-10 16:45:34.869173	SUBMITTED
250	97	1	2026-08-28	22	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:34.885961	2026-09-10 16:45:34.885961	SUBMITTED
251	97	1	2026-09-02	20	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:34.90419	2026-09-10 16:45:34.90419	SUBMITTED
252	97	2	2026-08-28	34	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:34.919301	2026-09-10 16:45:34.919301	SUBMITTED
254	97	3	2026-08-28	19	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:34.944454	2026-09-10 16:45:34.944454	SUBMITTED
257	97	4	2026-09-02	36	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:34.994141	2026-09-10 16:45:34.994141	SUBMITTED
258	98	1	2026-09-02	36	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.014467	2026-09-10 16:45:35.014467	SUBMITTED
259	98	1	2026-09-08	34	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.033091	2026-09-10 16:45:35.033091	SUBMITTED
260	98	2	2026-09-02	56	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.052024	2026-09-10 16:45:35.052024	SUBMITTED
261	98	2	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.069365	2026-09-10 16:45:35.069365	SUBMITTED
262	98	3	2026-09-02	31	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.089499	2026-09-10 16:45:35.089499	SUBMITTED
264	98	4	2026-09-02	66	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.123262	2026-09-10 16:45:35.123262	SUBMITTED
267	99	1	2026-08-01	24	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.174045	2026-09-10 16:45:35.174045	SUBMITTED
268	99	2	2026-09-08	48	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.192214	2026-09-10 16:45:35.192214	SUBMITTED
269	99	2	2026-08-01	46	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.209402	2026-09-10 16:45:35.209402	SUBMITTED
270	99	3	2026-09-08	19	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.225114	2026-09-10 16:45:35.225114	SUBMITTED
271	99	3	2026-08-01	17	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.242	2026-09-10 16:45:35.242	SUBMITTED
272	99	4	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.256871	2026-09-10 16:45:35.256871	SUBMITTED
274	100	1	2026-08-01	36	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.283116	2026-09-10 16:45:35.283116	SUBMITTED
277	100	2	2026-08-15	55	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.324146	2026-09-10 16:45:35.324146	SUBMITTED
278	100	3	2026-08-01	31	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.336711	2026-09-10 16:45:35.336711	SUBMITTED
279	100	3	2026-08-15	29	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.350268	2026-09-10 16:45:35.350268	SUBMITTED
280	100	4	2026-08-01	81	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.36233	2026-09-10 16:45:35.36233	SUBMITTED
281	100	4	2026-08-15	79	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.378988	2026-09-10 16:45:35.378988	SUBMITTED
282	101	1	2026-08-15	25	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.404941	2026-09-10 16:45:35.404941	SUBMITTED
284	101	2	2026-08-15	34	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.436722	2026-09-10 16:45:35.436722	SUBMITTED
287	101	3	2026-08-28	20	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.47718	2026-09-10 16:45:35.47718	SUBMITTED
288	101	4	2026-08-15	39	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.493522	2026-09-10 16:45:35.493522	SUBMITTED
289	101	4	2026-08-28	37	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.51041	2026-09-10 16:45:35.51041	SUBMITTED
290	102	1	2026-08-28	45	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.526571	2026-09-10 16:45:35.526571	SUBMITTED
291	102	1	2026-09-02	43	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.541247	2026-09-10 16:45:35.541247	SUBMITTED
292	102	2	2026-08-28	70	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.555289	2026-09-10 16:45:35.555289	SUBMITTED
294	102	3	2026-08-28	39	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.589067	2026-09-10 16:45:35.589067	SUBMITTED
297	102	4	2026-09-02	79	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.649146	2026-09-10 16:45:35.649146	SUBMITTED
298	103	1	2026-09-02	31	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.666513	2026-09-10 16:45:35.666513	SUBMITTED
299	103	1	2026-09-08	29	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.683875	2026-09-10 16:45:35.683875	SUBMITTED
300	103	2	2026-09-02	40	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.699752	2026-09-10 16:45:35.699752	SUBMITTED
301	103	2	2026-09-08	38	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.716549	2026-09-10 16:45:35.716549	SUBMITTED
302	103	3	2026-09-02	23	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.730088	2026-09-10 16:45:35.730088	SUBMITTED
304	103	4	2026-09-02	47	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.763934	2026-09-10 16:45:35.763934	SUBMITTED
307	104	1	2026-08-01	33	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:35.824727	2026-09-10 16:45:35.824727	SUBMITTED
308	104	2	2026-09-08	47	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:35.844972	2026-09-10 16:45:35.844972	SUBMITTED
309	104	2	2026-08-01	45	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:35.864044	2026-09-10 16:45:35.864044	SUBMITTED
310	104	3	2026-09-08	27	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:35.883176	2026-09-10 16:45:35.883176	SUBMITTED
311	104	3	2026-08-01	25	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.90411	2026-09-10 16:45:35.90411	SUBMITTED
312	104	4	2026-09-08	54	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.931928	2026-09-10 16:45:35.931928	SUBMITTED
315	105	1	2026-08-15	23	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.002404	2026-09-10 16:45:36.002404	SUBMITTED
318	105	3	2026-08-01	20	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.063924	2026-09-10 16:45:36.063924	SUBMITTED
319	105	3	2026-08-15	18	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.079034	2026-09-10 16:45:36.079034	SUBMITTED
320	105	4	2026-08-01	46	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.099785	2026-09-10 16:45:36.099785	SUBMITTED
321	105	4	2026-08-15	44	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.134501	2026-09-10 16:45:36.134501	SUBMITTED
322	106	1	2026-08-15	35	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.158237	2026-09-10 16:45:36.158237	SUBMITTED
323	106	1	2026-08-28	33	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.180403	2026-09-10 16:45:36.180403	SUBMITTED
325	106	2	2026-08-28	69	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.217232	2026-09-10 16:45:36.217232	SUBMITTED
328	106	4	2026-08-15	65	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.271105	2026-09-10 16:45:36.271105	SUBMITTED
329	106	4	2026-08-28	63	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.285828	2026-09-10 16:45:36.285828	SUBMITTED
330	107	1	2026-08-28	30	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.3021	2026-09-10 16:45:36.3021	SUBMITTED
296	102	4	2026-08-28	81	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:35.629538	2026-09-10 16:45:35.629538	SUBMITTED
303	103	3	2026-09-08	21	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:35.749402	2026-09-10 16:45:35.749402	SUBMITTED
306	104	1	2026-09-08	35	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.80619	2026-09-10 16:45:35.80619	SUBMITTED
313	104	4	2026-08-01	52	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:35.956671	2026-09-10 16:45:35.956671	SUBMITTED
314	105	1	2026-08-01	25	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:35.980897	2026-09-10 16:45:35.980897	SUBMITTED
317	105	2	2026-08-15	46	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.043246	2026-09-10 16:45:36.043246	SUBMITTED
324	106	2	2026-08-15	71	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.200011	2026-09-10 16:45:36.200011	SUBMITTED
327	106	3	2026-08-28	37	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.255842	2026-09-10 16:45:36.255842	SUBMITTED
334	107	3	2026-08-28	26	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.370124	2026-09-10 16:45:36.370124	SUBMITTED
337	107	4	2026-09-02	45	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.422399	2026-09-10 16:45:36.422399	SUBMITTED
344	108	4	2026-09-02	80	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.55121	2026-09-10 16:45:36.55121	SUBMITTED
347	109	1	2026-08-01	28	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.610628	2026-09-10 16:45:36.610628	SUBMITTED
354	110	1	2026-08-01	36	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.732267	2026-09-10 16:45:36.732267	SUBMITTED
357	110	2	2026-08-15	55	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.776574	2026-09-10 16:45:36.776574	SUBMITTED
364	111	2	2026-08-15	40	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.884208	2026-09-10 16:45:36.884208	SUBMITTED
367	111	3	2026-08-28	18	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.929076	2026-09-10 16:45:36.929076	SUBMITTED
374	112	3	2026-08-28	31	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.032345	2026-09-10 16:45:37.032345	SUBMITTED
377	112	4	2026-09-02	64	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.088875	2026-09-10 16:45:37.088875	SUBMITTED
384	113	4	2026-09-02	39	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.197333	2026-09-10 16:45:37.197333	SUBMITTED
387	114	1	2026-08-01	42	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:37.256595	2026-09-10 16:45:37.256595	SUBMITTED
394	115	1	2026-08-01	26	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:37.373961	2026-09-10 16:45:37.373961	SUBMITTED
397	115	2	2026-08-15	45	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.435529	2026-09-10 16:45:37.435529	SUBMITTED
404	116	2	2026-08-15	70	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:37.572175	2026-09-10 16:45:37.572175	SUBMITTED
407	116	3	2026-08-28	36	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.624627	2026-09-10 16:45:37.624627	SUBMITTED
414	117	3	2026-08-28	22	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.750428	2026-09-10 16:45:37.750428	SUBMITTED
417	117	4	2026-09-02	44	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.808999	2026-09-10 16:45:37.808999	SUBMITTED
424	118	4	2026-09-02	46	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.953244	2026-09-10 16:45:37.953244	SUBMITTED
332	107	2	2026-08-28	41	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.335566	2026-09-10 16:45:36.335566	SUBMITTED
333	107	2	2026-09-02	39	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.353941	2026-09-10 16:45:36.353941	SUBMITTED
335	107	3	2026-09-02	24	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.386794	2026-09-10 16:45:36.386794	SUBMITTED
338	108	1	2026-09-02	35	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.440691	2026-09-10 16:45:36.440691	SUBMITTED
339	108	1	2026-09-08	33	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.459406	2026-09-10 16:45:36.459406	SUBMITTED
340	108	2	2026-09-02	71	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.476696	2026-09-10 16:45:36.476696	SUBMITTED
341	108	2	2026-09-08	69	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.493202	2026-09-10 16:45:36.493202	SUBMITTED
342	108	3	2026-09-02	39	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.509894	2026-09-10 16:45:36.509894	SUBMITTED
343	108	3	2026-09-08	37	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.52924	2026-09-10 16:45:36.52924	SUBMITTED
345	108	4	2026-09-08	78	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.571033	2026-09-10 16:45:36.571033	SUBMITTED
348	109	2	2026-09-08	40	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.634982	2026-09-10 16:45:36.634982	SUBMITTED
349	109	2	2026-08-01	38	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.654214	2026-09-10 16:45:36.654214	SUBMITTED
350	109	3	2026-09-08	27	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.66965	2026-09-10 16:45:36.66965	SUBMITTED
351	109	3	2026-08-01	25	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.686183	2026-09-10 16:45:36.686183	SUBMITTED
352	109	4	2026-09-08	47	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.702019	2026-09-10 16:45:36.702019	SUBMITTED
353	109	4	2026-08-01	45	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.719134	2026-09-10 16:45:36.719134	SUBMITTED
355	110	1	2026-08-15	34	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.749467	2026-09-10 16:45:36.749467	SUBMITTED
358	110	3	2026-08-01	38	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:36.792096	2026-09-10 16:45:36.792096	SUBMITTED
359	110	3	2026-08-15	36	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:36.80815	2026-09-10 16:45:36.80815	SUBMITTED
360	110	4	2026-08-01	81	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.823632	2026-09-10 16:45:36.823632	SUBMITTED
361	110	4	2026-08-15	79	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.839421	2026-09-10 16:45:36.839421	SUBMITTED
362	111	1	2026-08-15	25	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.855644	2026-09-10 16:45:36.855644	SUBMITTED
363	111	1	2026-08-28	23	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.870225	2026-09-10 16:45:36.870225	SUBMITTED
365	111	2	2026-08-28	38	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:36.899161	2026-09-10 16:45:36.899161	SUBMITTED
368	111	4	2026-08-15	47	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:36.940369	2026-09-10 16:45:36.940369	SUBMITTED
369	111	4	2026-08-28	45	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:36.954098	2026-09-10 16:45:36.954098	SUBMITTED
370	112	1	2026-08-28	35	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:36.965839	2026-09-10 16:45:36.965839	SUBMITTED
371	112	1	2026-09-02	33	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:36.981541	2026-09-10 16:45:36.981541	SUBMITTED
372	112	2	2026-08-28	57	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:36.996589	2026-09-10 16:45:36.996589	SUBMITTED
373	112	2	2026-09-02	55	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.015472	2026-09-10 16:45:37.015472	SUBMITTED
375	112	3	2026-09-02	29	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.050632	2026-09-10 16:45:37.050632	SUBMITTED
378	113	1	2026-09-02	22	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:37.105057	2026-09-10 16:45:37.105057	SUBMITTED
379	113	1	2026-09-08	20	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:37.120179	2026-09-10 16:45:37.120179	SUBMITTED
380	113	2	2026-09-02	40	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:37.135282	2026-09-10 16:45:37.135282	SUBMITTED
381	113	2	2026-09-08	38	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.15089	2026-09-10 16:45:37.15089	SUBMITTED
382	113	3	2026-09-02	27	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.167925	2026-09-10 16:45:37.167925	SUBMITTED
383	113	3	2026-09-08	25	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.182979	2026-09-10 16:45:37.182979	SUBMITTED
385	113	4	2026-09-08	37	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.220204	2026-09-10 16:45:37.220204	SUBMITTED
388	114	2	2026-09-08	70	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:37.27472	2026-09-10 16:45:37.27472	SUBMITTED
389	114	2	2026-08-01	68	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.293903	2026-09-10 16:45:37.293903	SUBMITTED
390	114	3	2026-09-08	39	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.312129	2026-09-10 16:45:37.312129	SUBMITTED
391	114	3	2026-08-01	37	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.328159	2026-09-10 16:45:37.328159	SUBMITTED
392	114	4	2026-09-08	64	Floor Manager (Line 1)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.343858	2026-09-10 16:45:37.343858	SUBMITTED
393	114	4	2026-08-01	62	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.360928	2026-09-10 16:45:37.360928	SUBMITTED
395	115	1	2026-08-15	24	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:37.395326	2026-09-10 16:45:37.395326	SUBMITTED
398	115	3	2026-08-01	27	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.455572	2026-09-10 16:45:37.455572	SUBMITTED
399	115	3	2026-08-15	25	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.475648	2026-09-10 16:45:37.475648	SUBMITTED
400	115	4	2026-08-01	55	Vikramaditya Rao (Supervisor - Line 2)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.493967	2026-09-10 16:45:37.493967	SUBMITTED
401	115	4	2026-08-15	53	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.514008	2026-09-10 16:45:37.514008	SUBMITTED
402	116	1	2026-08-15	44	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:37.53489	2026-09-10 16:45:37.53489	SUBMITTED
403	116	1	2026-08-28	42	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:37.554205	2026-09-10 16:45:37.554205	SUBMITTED
405	116	2	2026-08-28	68	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.589277	2026-09-10 16:45:37.589277	SUBMITTED
408	116	4	2026-08-15	80	Umesh Rao (Supervisor - Line 3)	5-Cycle Time Study Run #1 conducted on Sleeve Attach Left	2026-09-10 16:45:37.639253	2026-09-10 16:45:37.639253	SUBMITTED
409	116	4	2026-08-28	78	Nandan Jain (QA Lead)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.657487	2026-09-10 16:45:37.657487	SUBMITTED
410	117	1	2026-08-28	21	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:37.676593	2026-09-10 16:45:37.676593	SUBMITTED
411	117	1	2026-09-02	19	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:37.693256	2026-09-10 16:45:37.693256	SUBMITTED
412	117	2	2026-08-28	34	Nandan Jain (QA Lead)	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:37.713223	2026-09-10 16:45:37.713223	SUBMITTED
413	117	2	2026-09-02	32	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.731943	2026-09-10 16:45:37.731943	SUBMITTED
415	117	3	2026-09-02	20	IE Dept Audit Team	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.770069	2026-09-10 16:45:37.770069	SUBMITTED
418	118	1	2026-09-02	26	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Shoulder Join	2026-09-10 16:45:37.826925	2026-09-10 16:45:37.826925	SUBMITTED
419	118	1	2026-09-08	24	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Shoulder Join	2026-09-10 16:45:37.848283	2026-09-10 16:45:37.848283	SUBMITTED
420	118	2	2026-09-02	40	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Rib Attach	2026-09-10 16:45:37.865806	2026-09-10 16:45:37.865806	SUBMITTED
421	118	2	2026-09-08	38	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Rib Attach	2026-09-10 16:45:37.886697	2026-09-10 16:45:37.886697	SUBMITTED
422	118	3	2026-09-02	26	IE Dept Audit Team	5-Cycle Time Study Run #1 conducted on Neck Top Stitch	2026-09-10 16:45:37.908117	2026-09-10 16:45:37.908117	SUBMITTED
423	118	3	2026-09-08	24	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Neck Top Stitch	2026-09-10 16:45:37.933252	2026-09-10 16:45:37.933252	SUBMITTED
425	118	4	2026-09-08	44	Floor Manager (Line 1)	5-Cycle Time Study Run #2 conducted on Sleeve Attach Left	2026-09-10 16:45:37.970635	2026-09-10 16:45:37.970635	SUBMITTED
\.


--
-- Data for Name: operator_station_placements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operator_station_placements (id, line_design_id, balance_workstation_id, operator_id, required_skill_level, actual_skill_level, match_status, notes) FROM stdin;
\.


--
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operators (id, employee_id, name, age, gender, department, joining_date, active, created_at, updated_at, role) FROM stdin;
69	EMP-001	Priya Sharma	26	Female	Sewing Line 1	2021-03-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
70	EMP-002	Rajesh Kumar	32	Male	Sewing Line 1	2020-07-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
71	EMP-003	Ananya Roy	24	Female	Sewing Line 1	2022-01-10	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
72	EMP-004	Deepa Patel	29	Female	Sewing Line 1	2021-09-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
73	EMP-005	Suresh Nair	35	Male	Sewing Line 1	2019-05-01	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
74	EMP-006	Fatima Begum	23	Female	Sewing Line 1	2023-02-18	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	FLOATER
75	EMP-007	Manoj Verma	28	Male	Sewing Line 1	2022-06-01	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
76	EMP-008	Kavita Sundaram	27	Female	Sewing Line 2	2021-04-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
77	EMP-009	Vikramaditya Rao	34	Male	Sewing Line 2	2018-02-28	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	LINE_SUPERVISOR
78	EMP-010	Meera Krishnan	25	Female	Sewing Line 2	2022-11-28	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
79	EMP-011	Arjun Sengupta	30	Male	Sewing Line 2	2020-11-12	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
80	EMP-012	Pooja Deshmukh	23	Female	Sewing Line 2	2023-04-01	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	HELPER
81	EMP-013	Mohanlal Meena	36	Male	Sewing Line 2	2019-01-08	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	QUALITY_CHECKER
82	EMP-014	Sunita Mahajan	29	Female	Sewing Line 2	2021-06-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	FLOATER
83	EMP-015	Rohan Kulkarni	24	Male	Sewing Line 2	2022-07-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
84	EMP-016	Naresh Soni	28	Male	Quality Control	2022-08-10	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	QUALITY_CHECKER
85	EMP-017	Umesh Rao	42	Male	Sewing Line 3	2016-04-03	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	LINE_SUPERVISOR
86	EMP-018	Ganesh Reddy	35	Male	Sewing Line 3	2019-10-18	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
87	EMP-019	Santosh Nair	27	Male	Sewing Line 3	2023-01-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
88	EMP-020	Yogesh Pillai	33	Male	Packing	2020-03-07	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
89	EMP-021	Pooja Das	25	Female	Sewing Line 3	2023-04-01	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
90	EMP-022	Neha Devi	31	Female	Finishing	2021-06-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
91	EMP-023	Asha Kumari	28	Female	Sewing Line 3	2022-09-05	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
92	EMP-024	Usha Bai	36	Female	Quality Control	2019-05-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	QUALITY_CHECKER
93	EMP-025	Manju Khan	29	Female	Sewing Line 3	2022-02-18	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
94	EMP-026	Saroj Ansari	34	Female	Finishing	2020-08-30	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
95	EMP-027	Kamlesh Sheikh	30	Male	Sewing Line 3	2021-10-12	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
96	EMP-028	Vijay Siddiqui	38	Male	Packing	2018-03-25	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	HELPER
97	EMP-029	Ajay Malik	26	Male	Sewing Line 1	2023-02-28	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	FLOATER
98	EMP-030	Sanjay Thakur	32	Male	Quality Control	2020-12-01	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	QUALITY_CHECKER
99	EMP-031	Arun Rathore	35	Male	Sewing Line 1	2019-07-08	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
100	EMP-032	Tarun Rajput	27	Male	Finishing	2022-05-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
101	EMP-033	Varun Bhatt	33	Male	Sewing Line 2	2020-09-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
102	EMP-034	Kiran Mehta	29	Female	Packing	2021-07-01	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
103	EMP-035	Nisha Shah	31	Female	Sewing Line 2	2021-03-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
104	EMP-036	Ritu Kapoor	26	Female	Quality Control	2023-01-10	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	QUALITY_CHECKER
105	EMP-037	Seema Malhotra	38	Female	Sewing Line 1	2018-06-05	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
106	EMP-038	Reena Bhatia	33	Female	Finishing	2020-04-14	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
107	EMP-039	Veena Khanna	28	Female	Sewing Line 3	2022-11-28	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
108	EMP-040	Leena Ahuja	35	Female	Packing	2019-02-07	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	HELPER
109	EMP-041	Mohan Arora	40	Male	Sewing Line 1	2017-08-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
110	EMP-042	Rohan Sethi	27	Male	Finishing	2022-07-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
111	EMP-043	Sohan Chopra	34	Male	Sewing Line 2	2020-01-22	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
112	EMP-044	Laxman Walia	30	Male	Quality Control	2021-05-30	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	QUALITY_CHECKER
113	EMP-045	Raman Bansal	36	Male	Sewing Line 3	2019-09-12	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
114	EMP-046	Bharat Mittal	29	Male	Packing	2022-04-08	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
115	EMP-047	Madan Agarwal	32	Male	Sewing Line 1	2020-10-25	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
116	EMP-048	Chandan Goyal	25	Male	Finishing	2023-03-15	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
117	EMP-049	Nandan Jain	44	Male	Quality Control	2016-01-20	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	LINE_SUPERVISOR
118	EMP-050	Pawan Tiwari	31	Male	Sewing Line 2	2021-08-05	t	2026-09-08 14:53:25.15099	2026-09-08 14:53:25.15099	OPERATOR
\.


--
-- Data for Name: optimization_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.optimization_recommendations (id, line_design_id, balance_workstation_id, strategy_type, title, reason, current_cycle_time_secs, projected_cycle_time_secs, projected_capacity_per_hour, status, created_at) FROM stdin;
\.


--
-- Data for Name: order_size_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_size_lines (id, order_id, size_id, quantity) FROM stdin;
16	5	2	1200
17	5	3	1600
18	5	4	1000
19	5	5	800
23	5	1	200
27	9	1	1000
28	9	2	2000
29	9	3	3000
30	9	4	3000
31	9	5	2000
32	9	6	1000
41	15	2	120
42	15	3	220
43	15	4	180
44	15	5	100
45	16	1	1000
46	16	2	2000
47	16	3	3000
48	16	4	3000
49	16	5	2000
50	16	6	3000
52	17	2	3000
53	17	3	4000
54	17	4	5000
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_no, buyer, style_id, color, order_date, delivery_date, status, total_quantity, created_at, updated_at, planned_completion_date) FROM stdin;
9	PO-2026-003	Netplay	2	white	2026-09-03	2026-09-13	PLANNED	12000	2026-09-03 17:44:45.11566	2026-09-03 17:45:23.529944	2026-09-10
5	PO-2026-002	Zara Men	5	Navy Blue	2026-08-25	2026-09-24	IN_PRODUCTION	4800	2026-08-25 12:06:01.025026	2026-09-08 14:48:58.957399	2026-09-22
16	PO-UNIQLO-DENIM-900	Uniqlo LifeWear	21	Vintage Indigo	2026-09-08	2026-10-23	PLANNED	14000	2026-09-08 14:45:05.455252	2026-09-09 12:36:30.459623	2026-10-08
15	PO-LEVIS-CHINO-620	Levi Strauss & Co	21	Khaki Tan	2026-09-07	2026-09-28	PLANNED	620	2026-09-08 14:45:05.455252	2026-09-09 16:47:36.369731	2026-09-28
17	PO-2026-004	Teamspirit	19	black	2026-09-12	2026-10-12	PLANNED	12000	2026-09-12 12:09:42.56472	2026-09-12 12:48:23.491178	2026-10-06
\.


--
-- Data for Name: piece_production_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.piece_production_logs (id, operator_id, operation_id, operation_name, order_id, target_qty, completed_qty, good_qty, reject_qty, start_time, end_time, actual_time_minutes, sam_minutes, machine_code, log_date, hour_slot, notes, created_at, updated_at) FROM stdin;
58	73	2	Neck Rib Attach	16	302	302	302	0	11:00:00	13:00:00	120.00	0.6500	4-Thread Overlock	2026-09-11	11	\N	2026-09-11 13:07:22.190873	2026-09-11 15:17:00.006091
63	69	1	Shoulder Join	17	200	200	200	0	10:00:00	12:00:00	120.00	0.4000	4-Thread Overlock	2026-09-12	10	\N	2026-09-12 15:47:43.684187	2026-09-12 15:47:43.684187
65	74	5	Sleeve Attach Right	17	198	198	198	0	10:00:00	12:00:00	120.00	0.4200	4-Thread Overlock	2026-09-12	10	\N	2026-09-12 15:48:20.643949	2026-09-12 15:48:20.643949
64	70	4	Sleeve Attach Left	17	198	198	198	0	10:00:00	12:00:00	120.00	0.7500	4-Thread Overlock	2026-09-12	10	\N	2026-09-12 15:48:03.810311	2026-09-12 15:49:19.744708
66	73	6	Side Seam Close	17	190	190	190	0	10:00:00	12:00:00	120.00	0.5000	4-Thread Overlock	2026-09-12	10	\N	2026-09-12 15:49:48.069212	2026-09-12 15:49:48.069212
67	75	7	Bottom Hem	17	190	190	190	0	10:00:00	12:00:00	120.00	1.2000	Flatlock / Interlock	2026-09-12	10	\N	2026-09-12 15:50:05.325994	2026-09-12 15:50:05.325994
68	81	10	Trim Check	17	190	190	190	0	10:00:00	12:00:00	120.00	0.3500	Manual / Trim Station	2026-09-12	10	\N	2026-09-12 15:50:19.512915	2026-09-12 15:50:19.512915
69	82	11	Thread Trimming	17	190	190	190	0	10:00:00	12:00:00	120.00	0.3500	Manual / Trim Station	2026-09-12	10	\N	2026-09-12 15:50:29.987939	2026-09-12 15:50:29.987939
70	77	12	Initial Inspection	17	190	190	190	0	10:00:00	12:00:00	120.00	0.3500	Inspection Table	2026-09-12	10	\N	2026-09-12 15:50:42.311568	2026-09-12 15:50:42.311568
55	79	5	Sleeve Attach Right	16	180	180	180	0	10:00:00	11:00:00	60.00	0.4200	4-Thread Overlock	2026-09-11	10	\N	2026-09-11 10:01:13.662856	2026-09-11 10:01:13.662856
56	72	6	Side Seam Close	16	150	150	150	0	10:00:00	11:00:00	60.00	0.5000	4-Thread Overlock	2026-09-11	10	\N	2026-09-11 10:14:25.285503	2026-09-11 10:14:25.285503
45	83	1	Shoulder Join	16	200	200	200	0	10:00:00	11:00:00	60.00	0.4000	4-Thread Overlock	2026-09-10	10	\N	2026-09-10 22:06:33.133963	2026-09-10 22:06:33.133963
46	73	2	Neck Rib Attach	16	200	200	198	2	10:00:00	11:00:00	60.00	0.6500	4-Thread Overlock	2026-09-10	10	\N	2026-09-10 22:07:15.378462	2026-09-10 22:07:15.378462
47	75	3	Neck Top Stitch	16	180	180	178	2	10:00:00	11:00:00	60.00	0.3500	Single Needle Lockstitch	2026-09-10	10	\N	2026-09-10 22:08:03.282002	2026-09-10 22:08:03.282002
48	71	4	Sleeve Attach Left	16	178	178	178	0	10:00:00	11:00:00	60.00	0.7500	4-Thread Overlock	2026-09-10	10	\N	2026-09-10 22:09:01.808029	2026-09-10 22:09:01.808029
49	79	5	Sleeve Attach Right	16	178	178	178	0	10:00:00	11:00:00	60.00	0.4200	4-Thread Overlock	2026-09-10	10	\N	2026-09-10 22:09:49.066253	2026-09-10 22:09:49.066253
50	72	6	Side Seam Close	16	178	178	178	0	10:00:00	11:00:00	60.00	0.5000	4-Thread Overlock	2026-09-10	10	\N	2026-09-10 22:10:12.840447	2026-09-10 22:10:12.840447
51	83	1	Shoulder Join	16	200	200	200	0	10:00:00	11:00:00	60.00	0.4000	4-Thread Overlock	2026-09-11	10	\N	2026-09-11 09:59:42.502709	2026-09-11 09:59:42.502709
52	73	2	Neck Rib Attach	16	200	200	198	2	10:00:00	11:00:00	60.00	0.6500	4-Thread Overlock	2026-09-11	10	\N	2026-09-11 09:59:59.455836	2026-09-11 09:59:59.455836
53	75	3	Neck Top Stitch	16	198	198	198	0	10:00:00	11:00:00	60.00	0.3500	Single Needle Lockstitch	2026-09-11	10	\N	2026-09-11 10:00:38.486143	2026-09-11 10:00:38.486143
54	71	4	Sleeve Attach Left	16	195	195	195	0	10:00:00	11:00:00	60.00	0.7500	4-Thread Overlock	2026-09-11	10	\N	2026-09-11 10:00:55.465442	2026-09-11 10:00:55.465442
60	71	4	Sleeve Attach Left	16	290	290	290	0	11:00:00	13:00:00	120.00	0.7500	4-Thread Overlock	2026-09-11	11	\N	2026-09-11 13:09:58.479805	2026-09-11 15:15:31.044393
61	79	5	Sleeve Attach Right	16	280	280	280	0	11:00:00	13:00:00	120.00	0.4200	4-Thread Overlock	2026-09-11	11	\N	2026-09-11 13:11:17.079005	2026-09-11 15:15:47.442481
62	72	6	Side Seam Close	16	290	290	290	0	11:00:00	13:00:00	120.00	0.5000	4-Thread Overlock	2026-09-11	11	\N	2026-09-11 13:12:02.100495	2026-09-11 15:16:08.202317
59	75	3	Neck Top Stitch	16	302	302	302	0	11:00:00	13:00:00	120.00	0.3500	Single Needle Lockstitch	2026-09-11	11	\N	2026-09-11 13:09:20.1847	2026-09-11 15:16:25.718116
57	83	1	Shoulder Join	16	300	300	300	0	11:00:00	13:00:00	120.00	0.4000	4-Thread Overlock	2026-09-11	11	\N	2026-09-11 13:06:25.66214	2026-09-11 15:16:40.922926
\.


--
-- Data for Name: sewing_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sewing_lines (id, line_code, line_name, floor, supervisor_name, target_efficiency_percent, active, created_at, updated_at, operator_count, machine_count, working_hours, capacity_per_day) FROM stdin;
1	LINE-01	Line 01 - Polo & T-Shirt	Floor 1 - Section A	Rahim Khan	85.00	t	2026-08-26 17:32:08.51482	2026-08-26 17:32:08.51482	22	24	8.00	1200
\.


--
-- Data for Name: shift_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_assignments (id, operator_id, shift_id, effective_from, effective_to, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, shift_code, shift_name, start_time, end_time, active, created_at, updated_at, break_duration_minutes) FROM stdin;
3	C	C Shift	23:00:00	07:00:00	t	2026-08-21 13:55:46.946279	2026-08-22 13:02:46.911267	60
2	B	B Shift	15:00:00	23:00:00	t	2026-08-21 13:55:46.946279	2026-08-24 09:50:45.576633	60
4	GENERAL	General Shift	09:00:00	18:00:00	t	2026-08-21 13:55:46.946279	2026-08-24 11:11:37.943431	60
1	A	A Shift	07:00:00	15:00:00	t	2026-08-21 13:55:46.946279	2026-08-26 10:12:18.233803	60
\.


--
-- Data for Name: sizes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sizes (id, code, label, sequence, active, created_at, updated_at) FROM stdin;
2	S	Small	2	t	2026-08-21 13:55:46.969229	2026-08-21 13:55:46.969229
3	M	Medium	3	t	2026-08-21 13:55:46.969229	2026-08-21 13:55:46.969229
4	L	Large	4	t	2026-08-21 13:55:46.969229	2026-08-21 13:55:46.969229
5	XL	Extra Large	5	t	2026-08-21 13:55:46.969229	2026-08-21 13:55:46.969229
6	XXL	Double XL	6	t	2026-08-21 13:55:46.969229	2026-08-21 13:55:46.969229
1	XS	Extra Small	1	t	2026-08-21 13:55:46.969229	2026-08-24 10:37:28.494766
7	95	95	7	t	2026-08-24 11:03:18.728744	2026-08-24 11:03:18.728744
\.


--
-- Data for Name: skill_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_assessments (id, operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes, created_at, updated_at) FROM stdin;
1130	69	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2944	69	1	3	28	4	2026-09-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.687676	2026-09-10 16:45:31.687676
1131	69	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1132	69	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1133	69	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2043	69	1	4	23	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:32.788353	2026-09-10 16:44:32.788353
2045	69	3	3	24	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:32.888045	2026-09-10 16:44:32.888045
2046	69	4	3	52	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:32.900087	2026-09-10 16:44:32.900087
2062	70	2	4	38	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:33.088981	2026-09-10 16:44:33.088981
2063	70	3	4	20	2	2026-08-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:33.099281	2026-09-10 16:44:33.099281
1134	69	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1135	69	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1136	69	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1137	69	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1138	69	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1139	70	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1140	70	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1141	70	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1142	70	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1143	70	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1144	70	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1145	70	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1146	70	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1147	70	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1148	71	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1149	71	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1150	71	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1151	71	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1152	71	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1153	71	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1154	71	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1155	71	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1156	71	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1157	72	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1158	72	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1159	72	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1160	72	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1161	72	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1162	72	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2950	69	4	2	63	4	2026-09-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:31.74555	2026-09-10 16:45:31.74555
1190	75	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2061	70	1	3	28	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:33.075387	2026-09-10 16:44:33.075387
2064	70	4	3	53	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:33.11031	2026-09-10 16:44:33.11031
2081	71	3	2	29	2	2026-01-15	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:33.269748	2026-09-10 16:44:33.269748
2098	72	2	4	38	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:33.469941	2026-09-10 16:44:33.469941
2118	73	4	4	44	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:33.915712	2026-09-10 16:44:33.915712
2134	74	2	4	38	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:34.143816	2026-09-10 16:44:34.143816
2151	75	1	2	34	2	2026-05-10	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:34.394279	2026-09-10 16:44:34.394279
2154	75	4	3	52	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.415673	2026-09-10 16:44:34.415673
2171	76	3	4	21	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:34.570163	2026-09-10 16:44:34.570163
2188	77	2	5	32	2	2026-01-15	f	Grade A+ Certified — Master technician pace on Neck Rib Attach, zero-defect standard	2026-09-10 16:44:34.754192	2026-09-10 16:44:34.754192
2047	69	5	4	25	2	2026-09-04	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:32.915656	2026-09-10 16:44:32.915656
2048	69	6	3	35	2	2026-09-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:32.92921	2026-09-10 16:44:32.92921
2080	71	2	4	38	2	2026-08-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:33.261199	2026-09-10 16:44:33.261199
2082	71	4	4	43	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:33.282011	2026-09-10 16:44:33.282011
2097	72	1	3	27	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:33.44978	2026-09-10 16:44:33.44978
2099	72	3	3	24	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:33.488281	2026-09-10 16:44:33.488281
2100	72	4	4	44	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:33.513165	2026-09-10 16:44:33.513165
2115	73	1	4	24	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:33.856591	2026-09-10 16:44:33.856591
2116	73	2	4	38	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:33.878227	2026-09-10 16:44:33.878227
2117	73	3	3	24	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:33.896802	2026-09-10 16:44:33.896802
2135	74	3	5	17	2	2026-07-01	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:34.162355	2026-09-10 16:44:34.162355
2136	74	4	5	37	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Sleeve Attach Left, zero-defect standard	2026-09-10 16:44:34.175948	2026-09-10 16:44:34.175948
2049	69	7	3	84	2	2026-09-02	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:32.942254	2026-09-10 16:44:32.942254
1196	76	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2153	75	3	5	17	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:34.409053	2026-09-10 16:44:34.409053
2169	76	1	4	24	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:34.543917	2026-09-10 16:44:34.543917
2170	76	2	3	45	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.560907	2026-09-10 16:44:34.560907
2172	76	4	3	53	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.576755	2026-09-10 16:44:34.576755
2187	77	1	5	19	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:34.746196	2026-09-10 16:44:34.746196
2189	77	3	5	17	2	2026-03-20	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:34.761007	2026-09-10 16:44:34.761007
2190	77	4	4	43	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:34.766534	2026-09-10 16:44:34.766534
2050	69	8	2	35	2	2026-09-01	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:32.952184	2026-09-10 16:44:32.952184
2218	78	14	1	37	1	2026-08-17	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:34.950805	2026-09-10 16:44:34.950805
2241	80	1	1	43	2	2026-05-10	f	Trainee Level — Basic machine setup & orientation completed for Shoulder Join	2026-09-10 16:44:35.111996	2026-09-10 16:44:35.111996
2244	80	4	1	79	2	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:35.130226	2026-09-10 16:44:35.130226
2261	81	3	2	29	2	2026-01-15	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:35.240282	2026-09-10 16:44:35.240282
2278	82	2	4	38	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:35.344584	2026-09-10 16:44:35.344584
2298	83	4	3	52	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.476156	2026-09-10 16:44:35.476156
2314	84	2	2	54	1	2026-05-10	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:35.572381	2026-09-10 16:44:35.572381
2331	85	1	5	19	2	2026-05-10	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:35.656076	2026-09-10 16:44:35.656076
2334	85	4	5	37	2	2026-01-15	f	Grade A+ Certified — Master technician pace on Sleeve Attach Left, zero-defect standard	2026-09-10 16:44:35.672032	2026-09-10 16:44:35.672032
2351	86	3	4	20	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:35.760714	2026-09-10 16:44:35.760714
2051	69	9	3	24	2	2026-08-31	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:32.96502	2026-09-10 16:44:32.96502
1233	79	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1247	81	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1254	81	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2206	78	2	2	54	2	2026-03-20	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:34.870909	2026-09-10 16:44:34.870909
2207	78	3	5	18	2	2026-05-10	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:34.877999	2026-09-10 16:44:34.877999
2223	79	1	3	27	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.981878	2026-09-10 16:44:34.981878
2225	79	3	4	20	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:34.99457	2026-09-10 16:44:34.99457
2226	79	4	3	52	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.0064	2026-09-10 16:44:35.0064
2242	80	2	1	68	2	2026-07-01	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:35.117214	2026-09-10 16:44:35.117214
2243	80	3	1	36	2	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:35.125584	2026-09-10 16:44:35.125584
2259	81	1	3	28	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.227125	2026-09-10 16:44:35.227125
2260	81	2	3	45	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.232649	2026-09-10 16:44:35.232649
2262	81	4	2	64	2	2026-03-20	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:35.248903	2026-09-10 16:44:35.248903
2052	69	10	3	24	1	2026-08-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:32.976573	2026-09-10 16:44:32.976573
2053	69	11	3	24	1	2026-08-29	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:32.983937	2026-09-10 16:44:32.983937
2279	82	3	5	17	2	2026-03-20	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:35.349383	2026-09-10 16:44:35.349383
2280	82	4	4	44	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:35.355682	2026-09-10 16:44:35.355682
2295	83	1	4	24	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:35.442236	2026-09-10 16:44:35.442236
2296	83	2	4	38	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:35.448291	2026-09-10 16:44:35.448291
2297	83	3	3	24	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.455328	2026-09-10 16:44:35.455328
2315	84	3	2	30	1	2026-07-01	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:35.577985	2026-09-10 16:44:35.577985
2316	84	4	3	52	1	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.581996	2026-09-10 16:44:35.581996
2332	85	2	5	31	2	2026-07-01	f	Grade A+ Certified — Master technician pace on Neck Rib Attach, zero-defect standard	2026-09-10 16:44:35.66076	2026-09-10 16:44:35.66076
2333	85	3	5	17	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:35.66437	2026-09-10 16:44:35.66437
2054	69	12	2	29	1	2026-08-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:32.995786	2026-09-10 16:44:32.995786
1290	86	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1304	87	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2350	86	2	5	32	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Neck Rib Attach, zero-defect standard	2026-09-10 16:44:35.756077	2026-09-10 16:44:35.756077
2352	86	4	5	37	2	2026-03-20	f	Grade A+ Certified — Master technician pace on Sleeve Attach Left, zero-defect standard	2026-09-10 16:44:35.765768	2026-09-10 16:44:35.765768
2367	87	1	3	28	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.860708	2026-09-10 16:44:35.860708
2369	87	3	4	20	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:35.872464	2026-09-10 16:44:35.872464
2370	87	4	2	63	2	2026-05-10	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:35.879087	2026-09-10 16:44:35.879087
2385	88	1	2	34	1	2026-01-15	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:35.963884	2026-09-10 16:44:35.963884
2386	88	2	1	69	1	2026-03-20	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:35.969945	2026-09-10 16:44:35.969945
2387	88	3	1	37	1	2026-05-10	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:35.975433	2026-09-10 16:44:35.975433
2055	69	13	2	29	1	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.004828	2026-09-10 16:44:33.004828
2388	88	4	1	79	1	2026-07-01	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:35.98106	2026-09-10 16:44:35.98106
2404	89	2	4	39	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:36.092158	2026-09-10 16:44:36.092158
2421	90	1	1	42	1	2026-05-10	f	Trainee Level — Basic machine setup & orientation completed for Shoulder Join	2026-09-10 16:44:36.229912	2026-09-10 16:44:36.229912
2424	90	4	1	79	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:36.248932	2026-09-10 16:44:36.248932
2441	91	3	2	30	2	2026-01-15	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:36.343101	2026-09-10 16:44:36.343101
2458	92	2	3	46	1	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.439835	2026-09-10 16:44:36.439835
2478	93	4	2	63	2	2026-07-01	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:36.558948	2026-09-10 16:44:36.558948
2494	94	2	2	54	1	2026-05-10	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:36.646623	2026-09-10 16:44:36.646623
2511	95	1	3	28	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.744435	2026-09-10 16:44:36.744435
2407	89	5	3	29	2	2026-08-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.112831	2026-09-10 16:44:36.112831
1329	91	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2405	89	3	2	30	2	2026-07-01	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:36.096405	2026-09-10 16:44:36.096405
2406	89	4	3	52	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.106093	2026-09-10 16:44:36.106093
2422	90	2	2	55	1	2026-07-01	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:36.237619	2026-09-10 16:44:36.237619
2423	90	3	1	37	1	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:36.244131	2026-09-10 16:44:36.244131
2439	91	1	3	28	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.330292	2026-09-10 16:44:36.330292
2440	91	2	3	46	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.334587	2026-09-10 16:44:36.334587
2442	91	4	3	52	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.346715	2026-09-10 16:44:36.346715
2457	92	1	2	33	1	2026-08-15	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:36.430312	2026-09-10 16:44:36.430312
2459	92	3	3	25	1	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.446362	2026-09-10 16:44:36.446362
2460	92	4	3	52	1	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.450875	2026-09-10 16:44:36.450875
2056	69	14	1	37	1	2026-08-26	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.014922	2026-09-10 16:44:33.014922
1363	96	9	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2476	93	2	3	46	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.544908	2026-09-10 16:44:36.544908
2477	93	3	4	21	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:36.549906	2026-09-10 16:44:36.549906
2493	94	1	2	34	1	2026-03-20	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:36.641923	2026-09-10 16:44:36.641923
2495	94	3	2	30	1	2026-07-01	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:36.650329	2026-09-10 16:44:36.650329
2496	94	4	2	62	1	2026-08-15	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:36.65924	2026-09-10 16:44:36.65924
2512	95	2	3	45	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.748964	2026-09-10 16:44:36.748964
2513	95	3	4	21	2	2026-08-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:36.756089	2026-09-10 16:44:36.756089
2529	96	1	1	41	1	2026-07-01	f	Trainee Level — Basic machine setup & orientation completed for Shoulder Join	2026-09-10 16:44:36.844729	2026-09-10 16:44:36.844729
2530	96	2	1	68	1	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:36.848819	2026-09-10 16:44:36.848819
2532	96	4	1	79	1	2026-03-20	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:36.861884	2026-09-10 16:44:36.861884
2057	69	15	3	24	1	2026-08-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.024824	2026-09-10 16:44:33.024824
2058	69	16	3	24	1	2026-08-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.033817	2026-09-10 16:44:33.033817
1399	101	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2531	96	3	1	37	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:36.856767	2026-09-10 16:44:36.856767
2548	97	2	5	32	2	2026-01-15	f	Grade A+ Certified — Master technician pace on Neck Rib Attach, zero-defect standard	2026-09-10 16:44:36.962945	2026-09-10 16:44:36.962945
2568	98	4	2	64	1	2026-07-01	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:37.091084	2026-09-10 16:44:37.091084
2584	99	2	3	46	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.187985	2026-09-10 16:44:37.187985
2601	100	1	2	34	1	2026-05-10	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:37.3105	2026-09-10 16:44:37.3105
2604	100	4	1	79	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:37.326661	2026-09-10 16:44:37.326661
2621	101	3	4	20	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:37.412016	2026-09-10 16:44:37.412016
2638	102	2	1	68	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:37.499379	2026-09-10 16:44:37.499379
1369	97	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2059	69	17	2	29	1	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.045713	2026-09-10 16:44:33.045713
2060	69	18	2	29	1	2026-08-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.054659	2026-09-10 16:44:33.054659
2549	97	3	5	17	2	2026-03-20	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:36.967981	2026-09-10 16:44:36.967981
2550	97	4	5	36	2	2026-05-10	f	Grade A+ Certified — Master technician pace on Sleeve Attach Left, zero-defect standard	2026-09-10 16:44:36.975889	2026-09-10 16:44:36.975889
2565	98	1	2	34	1	2026-01-15	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:37.073989	2026-09-10 16:44:37.073989
2567	98	3	2	29	1	2026-05-10	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:37.084023	2026-09-10 16:44:37.084023
2583	99	1	4	24	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:37.18177	2026-09-10 16:44:37.18177
2585	99	3	5	17	2	2026-07-01	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:37.193906	2026-09-10 16:44:37.193906
2586	99	4	3	52	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.2066	2026-09-10 16:44:37.2066
2602	100	2	2	55	1	2026-07-01	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:37.315954	2026-09-10 16:44:37.315954
2603	100	3	2	29	1	2026-08-15	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:37.321951	2026-09-10 16:44:37.321951
2954	70	2	4	38	4	2026-09-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:31.796923	2026-09-10 16:45:31.796923
2620	101	2	5	32	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Neck Rib Attach, zero-defect standard	2026-09-10 16:44:37.408317	2026-09-10 16:44:37.408317
2622	101	4	5	37	2	2026-03-20	f	Grade A+ Certified — Master technician pace on Sleeve Attach Left, zero-defect standard	2026-09-10 16:44:37.416752	2026-09-10 16:44:37.416752
2637	102	1	1	43	1	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Shoulder Join	2026-09-10 16:44:37.49533	2026-09-10 16:44:37.49533
2639	102	3	1	37	1	2026-03-20	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:37.505626	2026-09-10 16:44:37.505626
2640	102	4	1	79	1	2026-05-10	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:37.510331	2026-09-10 16:44:37.510331
2655	103	1	3	29	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.586624	2026-09-10 16:44:37.586624
2656	103	2	4	38	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:37.592165	2026-09-10 16:44:37.592165
2657	103	3	4	21	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:37.596277	2026-09-10 16:44:37.596277
2956	70	3	4	21	4	2026-09-05	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:31.811297	2026-09-10 16:45:31.811297
1425	105	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2691	105	1	4	23	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:37.749474	2026-09-10 16:44:37.749474
2694	105	4	4	44	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:37.766988	2026-09-10 16:44:37.766988
2711	106	3	1	37	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:37.845505	2026-09-10 16:44:37.845505
2728	107	2	4	39	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:37.924149	2026-09-10 16:44:37.924149
2748	108	4	1	78	1	2026-07-01	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:38.031865	2026-09-10 16:44:38.031865
2764	109	2	4	38	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:38.115058	2026-09-10 16:44:38.115058
2781	110	1	2	34	1	2026-05-10	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:38.205444	2026-09-10 16:44:38.205444
2784	110	4	1	79	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:38.218758	2026-09-10 16:44:38.218758
2801	111	3	5	18	2	2026-01-15	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:38.305794	2026-09-10 16:44:38.305794
2818	112	2	2	55	1	2026-01-15	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:38.383726	2026-09-10 16:44:38.383726
2958	70	4	3	52	4	2026-09-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.826803	2026-09-10 16:45:31.826803
1423	104	14	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2675	104	3	3	25	1	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.677915	2026-09-10 16:44:37.677915
2676	104	4	3	52	1	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.681918	2026-09-10 16:44:37.681918
2692	105	2	3	46	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.756957	2026-09-10 16:44:37.756957
2693	105	3	5	18	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Neck Top Stitch, zero-defect standard	2026-09-10 16:44:37.763278	2026-09-10 16:44:37.763278
2709	106	1	2	33	1	2026-07-01	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:37.834674	2026-09-10 16:44:37.834674
2710	106	2	1	69	1	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:37.841782	2026-09-10 16:44:37.841782
2712	106	4	2	63	1	2026-03-20	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:37.849196	2026-09-10 16:44:37.849196
2727	107	1	3	28	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.918346	2026-09-10 16:44:37.918346
2729	107	3	3	24	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.927851	2026-09-10 16:44:37.927851
2730	107	4	4	45	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:37.931855	2026-09-10 16:44:37.931855
2065	70	5	3	29	2	2026-09-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.118901	2026-09-10 16:44:33.118901
2066	70	6	2	42	2	2026-09-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.129979	2026-09-10 16:44:33.129979
1455	109	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2746	108	2	1	69	1	2026-03-20	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:38.016877	2026-09-10 16:44:38.016877
2747	108	3	1	37	1	2026-05-10	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:38.026826	2026-09-10 16:44:38.026826
2763	109	1	3	28	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.110714	2026-09-10 16:44:38.110714
2765	109	3	3	25	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.122173	2026-09-10 16:44:38.122173
2766	109	4	4	45	2	2026-08-15	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:38.126881	2026-09-10 16:44:38.126881
2783	110	3	1	36	1	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:38.213748	2026-09-10 16:44:38.213748
2799	111	1	4	23	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:38.295309	2026-09-10 16:44:38.295309
2800	111	2	4	38	2	2026-08-15	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:38.300056	2026-09-10 16:44:38.300056
2802	111	4	4	45	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:38.310296	2026-09-10 16:44:38.310296
2067	70	7	3	84	2	2026-09-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.139269	2026-09-10 16:44:33.139269
2068	70	8	5	21	2	2026-08-31	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:33.149124	2026-09-10 16:44:33.149124
2820	112	4	2	64	1	2026-05-10	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:38.392838	2026-09-10 16:44:38.392838
2835	113	1	5	20	2	2026-01-15	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:38.464107	2026-09-10 16:44:38.464107
2836	113	2	4	38	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:38.467915	2026-09-10 16:44:38.467915
2837	113	3	3	25	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.473985	2026-09-10 16:44:38.473985
2853	114	1	1	42	1	2026-03-20	f	Trainee Level — Basic machine setup & orientation completed for Shoulder Join	2026-09-10 16:44:38.550884	2026-09-10 16:44:38.550884
2855	114	3	1	37	1	2026-07-01	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:38.56193	2026-09-10 16:44:38.56193
2856	114	4	2	62	1	2026-08-15	f	Grade C — Developing cross-training on Sleeve Attach Left; under line supervisor coaching	2026-09-10 16:44:38.565589	2026-09-10 16:44:38.565589
2872	115	2	3	45	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.643841	2026-09-10 16:44:38.643841
2873	115	3	3	25	2	2026-08-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.646556	2026-09-10 16:44:38.646556
1163	72	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1164	72	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1165	72	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1166	72	10	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1167	72	11	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1168	72	12	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1169	73	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1170	73	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1171	73	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1172	73	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1173	73	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1174	73	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1175	73	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1176	73	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1177	73	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1178	74	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1179	74	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1180	74	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1181	74	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1182	74	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1183	74	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1184	74	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1185	74	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1186	74	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1187	75	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1188	75	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1189	75	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2069	70	9	3	24	2	2026-08-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.159157	2026-09-10 16:44:33.159157
2854	114	2	1	68	1	2026-05-10	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:38.558231	2026-09-10 16:44:38.558231
2871	115	1	4	24	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:38.639755	2026-09-10 16:44:38.639755
2874	115	4	3	53	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.651873	2026-09-10 16:44:38.651873
2891	116	3	1	36	1	2026-01-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Top Stitch	2026-09-10 16:44:38.732915	2026-09-10 16:44:38.732915
2070	70	10	2	29	1	2026-08-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.165673	2026-09-10 16:44:33.165673
2071	70	11	2	29	1	2026-08-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.1756	2026-09-10 16:44:33.1756
1191	75	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1192	75	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1193	75	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1194	75	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1195	75	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1197	76	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1198	76	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1199	76	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1200	76	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1201	76	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1202	76	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1203	76	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1204	76	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1205	76	10	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1206	76	11	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1207	76	12	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1208	77	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1209	77	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1210	77	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1211	77	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1212	77	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1213	77	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1214	77	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1215	77	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1216	77	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1217	78	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1218	78	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1219	78	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1220	78	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1221	78	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1222	78	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1223	78	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1224	78	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1225	78	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1226	79	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1227	79	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1228	79	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1229	79	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1230	79	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1231	79	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1232	79	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1234	79	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1235	80	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1236	80	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1237	80	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1238	80	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1239	80	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1240	80	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1241	80	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1242	80	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1243	80	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1244	80	10	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1245	80	11	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1246	80	12	3	22	1	2026-08-09	f	Cross-trained secondary station	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2943	69	1	5	25	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 25.0s)	2026-09-10 16:45:31.676441	2026-09-10 16:45:31.676441
1248	81	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1249	81	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1250	81	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1251	81	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1252	81	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1253	81	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1255	81	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1256	82	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1257	82	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1258	82	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1259	82	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1260	82	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1261	82	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1262	82	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1263	82	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1264	82	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1265	83	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1266	83	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1267	83	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1268	83	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1269	83	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1270	83	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1271	83	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1272	83	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1273	83	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1274	84	10	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1275	84	12	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1276	84	14	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1277	84	15	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1278	85	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1279	85	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1280	85	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1281	85	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1282	85	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1283	85	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1284	85	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1285	85	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1286	85	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1287	86	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1288	86	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1289	86	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1291	86	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1292	86	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1293	86	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1294	86	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1295	86	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1296	87	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1297	87	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1298	87	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1299	87	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1300	87	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1301	87	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1302	87	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1303	87	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1305	88	9	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1306	88	11	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1307	88	13	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1308	88	16	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1309	88	17	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1310	88	18	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1311	89	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1312	89	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1313	89	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1314	89	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1315	89	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1316	89	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1317	89	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1318	89	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1319	89	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1320	90	9	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1321	90	11	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1322	90	13	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1323	90	16	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1324	90	17	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1325	90	18	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1326	91	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1327	91	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1328	91	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1330	91	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1331	91	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1332	91	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1333	91	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1334	91	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1335	92	10	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1336	92	12	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1337	92	14	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1338	92	15	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1339	93	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1340	93	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1341	93	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1342	93	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1343	93	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1344	93	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1345	93	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1346	93	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1347	93	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1348	94	9	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1349	94	11	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1350	94	13	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1351	94	16	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1352	94	17	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1353	94	18	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1354	95	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1355	95	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1356	95	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1357	95	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1358	95	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1359	95	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1360	95	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1361	95	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1362	95	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1364	96	11	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1365	96	13	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1366	96	16	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1367	96	17	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1368	96	18	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1370	97	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1371	97	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1372	97	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1373	97	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1374	97	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1375	97	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1376	97	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1377	97	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1378	98	10	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1379	98	12	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1380	98	14	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1381	98	15	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1382	99	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1383	99	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1384	99	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1385	99	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1386	99	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1387	99	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1388	99	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1389	99	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1390	99	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1391	100	9	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1392	100	11	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1393	100	13	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1394	100	16	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1395	100	17	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1396	100	18	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1397	101	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1398	101	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1400	101	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1401	101	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1402	101	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1403	101	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1404	101	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1405	101	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1406	102	9	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1407	102	11	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1408	102	13	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1409	102	16	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1410	102	17	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1411	102	18	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1412	103	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1413	103	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1414	103	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1415	103	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1416	103	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1417	103	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1418	103	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1419	103	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1420	103	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1421	104	10	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1422	104	12	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2044	69	2	4	38	2	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:32.868201	2026-09-10 16:44:32.868201
1424	104	15	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1426	105	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1427	105	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1428	105	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1429	105	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1430	105	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1431	105	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1432	105	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1433	105	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1434	106	9	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1435	106	11	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1436	106	13	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1437	106	16	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1438	106	17	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1439	106	18	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1440	107	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1441	107	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1442	107	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1443	107	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1444	107	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1445	107	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1446	107	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1447	107	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1448	107	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1449	108	9	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1450	108	11	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1451	108	13	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1452	108	16	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1453	108	17	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1454	108	18	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1456	109	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1457	109	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1458	109	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1459	109	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1460	109	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1461	109	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1462	109	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1463	109	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1464	110	9	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1465	110	11	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1466	110	13	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1467	110	16	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1468	110	17	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1469	110	18	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1470	111	1	4	24	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1471	111	2	5	35	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1472	111	3	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1473	111	4	4	45	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1474	111	5	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1475	111	6	3	35	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1476	111	7	4	72	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1477	111	8	5	23	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1478	111	9	3	24	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1479	112	10	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1480	112	12	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1481	112	14	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1482	112	15	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2072	70	12	2	29	1	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.184121	2026-09-10 16:44:33.184121
2889	116	1	1	42	1	2026-07-01	f	Trainee Level — Basic machine setup & orientation completed for Shoulder Join	2026-09-10 16:44:38.724816	2026-09-10 16:44:38.724816
2890	116	2	1	68	1	2026-08-15	f	Trainee Level — Basic machine setup & orientation completed for Neck Rib Attach	2026-09-10 16:44:38.728918	2026-09-10 16:44:38.728918
2892	116	4	1	78	1	2026-03-20	f	Trainee Level — Basic machine setup & orientation completed for Sleeve Attach Left	2026-09-10 16:44:38.739901	2026-09-10 16:44:38.739901
1483	113	1	3	28	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1484	113	2	4	39	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1485	113	3	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1486	113	4	3	52	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1487	113	5	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1488	113	6	5	27	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1489	113	7	3	83	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1490	113	8	4	25	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1491	113	9	5	19	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1492	114	9	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1493	114	11	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1494	114	13	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1495	114	16	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1496	114	17	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1497	114	18	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1498	115	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1499	115	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1500	115	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1501	115	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1502	115	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1503	115	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1504	115	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1505	115	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1506	115	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1507	116	9	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1508	116	11	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1509	116	13	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1510	116	16	3	24	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1511	116	17	4	21	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1512	116	18	5	19	1	2026-08-19	f	Finishing & Packaging Certified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1513	117	10	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1514	117	12	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1515	117	14	5	19	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1517	118	1	5	22	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1518	118	2	3	45	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1519	118	3	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1520	118	4	5	41	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1521	118	5	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1522	118	6	4	30	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1523	118	7	5	65	1	2026-08-25	f	Grade A+ Certified - High efficiency & zero defect record	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1524	118	8	3	29	1	2026-08-25	f	Grade B Certified - Standard operating procedure qualified	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
1525	118	9	4	21	1	2026-08-25	f	Grade A Certified - Consistent target cycle time	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2946	69	2	3	45	4	2026-09-07	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.706091	2026-09-10 16:45:31.706091
1516	117	15	4	21	1	2026-08-29	f	Certified QA/QC Inspector	2026-09-08 15:05:33.625487	2026-09-08 15:05:33.625487
2948	69	3	3	24	4	2026-09-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.722129	2026-09-10 16:45:31.722129
2945	69	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:31.695497	2026-09-10 16:45:31.695497
2947	69	3	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:31.712989	2026-09-10 16:45:31.712989
2951	70	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:31.769708	2026-09-10 16:45:31.769708
2953	70	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:31.789118	2026-09-10 16:45:31.789118
2955	70	3	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:31.80502	2026-09-10 16:45:31.80502
2957	70	4	1	55	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 55.0s)	2026-09-10 16:45:31.820597	2026-09-10 16:45:31.820597
2961	71	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:31.854538	2026-09-10 16:45:31.854538
2963	71	3	5	31	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 31.0s)	2026-09-10 16:45:31.871472	2026-09-10 16:45:31.871472
2965	71	4	3	45	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 45.0s)	2026-09-10 16:45:31.886621	2026-09-10 16:45:31.886621
2967	72	1	5	29	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 29.0s)	2026-09-10 16:45:31.901796	2026-09-10 16:45:31.901796
2971	72	3	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:31.934894	2026-09-10 16:45:31.934894
2973	72	4	3	46	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:31.950147	2026-09-10 16:45:31.950147
2975	73	1	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:31.969284	2026-09-10 16:45:31.969284
2977	73	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:31.98594	2026-09-10 16:45:31.98594
2981	73	4	3	46	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:32.020941	2026-09-10 16:45:32.020941
2133	74	1	5	20	2	2026-03-20	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:34.128045	2026-09-10 16:44:34.128045
2983	74	1	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:32.038632	2026-09-10 16:45:32.038632
2985	74	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:32.051203	2026-09-10 16:45:32.051203
2987	74	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:32.069206	2026-09-10 16:45:32.069206
2991	75	1	3	36	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:32.146161	2026-09-10 16:45:32.146161
2928	118	4	4	44	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:38.916965	2026-09-10 16:44:38.916965
2952	70	1	2	34	4	2026-09-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:31.780932	2026-09-10 16:45:31.780932
2949	69	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:31.736803	2026-09-10 16:45:31.736803
2079	71	1	3	27	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:33.250244	2026-09-10 16:44:33.250244
2959	71	1	5	29	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 29.0s)	2026-09-10 16:45:31.836759	2026-09-10 16:45:31.836759
2969	72	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:31.917036	2026-09-10 16:45:31.917036
2979	73	3	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:32.003788	2026-09-10 16:45:32.003788
2989	74	4	4	39	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:32.111198	2026-09-10 16:45:32.111198
2152	75	2	2	54	2	2026-07-01	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:34.401415	2026-09-10 16:44:34.401415
2993	75	2	2	56	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 56.0s)	2026-09-10 16:45:32.20011	2026-09-10 16:45:32.20011
2995	75	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:32.263663	2026-09-10 16:45:32.263663
2997	75	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:32.30412	2026-09-10 16:45:32.30412
2999	76	1	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:32.344702	2026-09-10 16:45:32.344702
2907	117	1	5	19	1	2026-08-15	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:38.810081	2026-09-10 16:44:38.810081
2909	117	3	4	20	1	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Top Stitch	2026-09-10 16:44:38.822773	2026-09-10 16:44:38.822773
2910	117	4	4	44	1	2026-05-10	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:38.827131	2026-09-10 16:44:38.827131
2925	118	1	4	24	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:38.898927	2026-09-10 16:44:38.898927
2926	118	2	4	38	2	2026-03-20	f	Grade A Certified — Consistently meets 100% standard SAM on Neck Rib Attach	2026-09-10 16:44:38.905174	2026-09-10 16:44:38.905174
2927	118	3	3	24	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:38.912221	2026-09-10 16:44:38.912221
3003	76	3	5	23	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 23.0s)	2026-09-10 16:45:32.426807	2026-09-10 16:45:32.426807
3013	77	4	3	45	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 45.0s)	2026-09-10 16:45:32.625623	2026-09-10 16:45:32.625623
3023	79	1	5	29	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 29.0s)	2026-09-10 16:45:32.775265	2026-09-10 16:45:32.775265
3033	80	2	1	70	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 70.0s)	2026-09-10 16:45:32.924258	2026-09-10 16:45:32.924258
3043	81	3	5	31	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 31.0s)	2026-09-10 16:45:33.060507	2026-09-10 16:45:33.060507
3053	82	4	3	46	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:33.209674	2026-09-10 16:45:33.209674
2313	84	1	2	34	1	2026-03-20	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:35.56697	2026-09-10 16:44:35.56697
3063	84	1	3	36	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:33.370992	2026-09-10 16:45:33.370992
3073	85	2	5	33	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 33.0s)	2026-09-10 16:45:33.561238	2026-09-10 16:45:33.561238
3083	86	3	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:33.687616	2026-09-10 16:45:33.687616
3093	87	4	1	65	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 65.0s)	2026-09-10 16:45:33.810664	2026-09-10 16:45:33.810664
2403	89	1	3	28	2	2026-03-20	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.085195	2026-09-10 16:44:36.085195
3103	89	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:33.970597	2026-09-10 16:45:33.970597
3113	90	2	2	57	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 57.0s)	2026-09-10 16:45:34.11124	2026-09-10 16:45:34.11124
3123	91	3	5	32	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 32.0s)	2026-09-10 16:45:34.253921	2026-09-10 16:45:34.253921
3133	92	4	2	54	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:34.381109	2026-09-10 16:45:34.381109
3143	94	1	3	36	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:34.527185	2026-09-10 16:45:34.527185
3153	95	2	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:34.686692	2026-09-10 16:45:34.686692
3163	96	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:34.832035	2026-09-10 16:45:34.832035
3173	97	4	4	38	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 38.0s)	2026-09-10 16:45:34.984775	2026-09-10 16:45:34.984775
3183	99	1	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:35.16463	2026-09-10 16:45:35.16463
3193	100	2	2	57	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 57.0s)	2026-09-10 16:45:35.317985	2026-09-10 16:45:35.317985
3203	101	3	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:35.471036	2026-09-10 16:45:35.471036
3213	102	4	1	81	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:35.639485	2026-09-10 16:45:35.639485
2673	104	1	2	33	1	2026-03-20	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:37.66811	2026-09-10 16:44:37.66811
3223	104	1	3	35	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 35.0s)	2026-09-10 16:45:35.81649	2026-09-10 16:45:35.81649
3231	105	1	5	25	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 25.0s)	2026-09-10 16:45:35.990271	2026-09-10 16:45:35.990271
3241	106	2	1	71	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 71.0s)	2026-09-10 16:45:36.207401	2026-09-10 16:45:36.207401
3251	107	3	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:36.376213	2026-09-10 16:45:36.376213
2073	70	13	3	24	1	2026-08-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.193154	2026-09-10 16:44:33.193154
3001	76	2	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:32.387245	2026-09-10 16:45:32.387245
3005	76	4	1	55	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 55.0s)	2026-09-10 16:45:32.471202	2026-09-10 16:45:32.471202
3007	77	1	5	21	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 21.0s)	2026-09-10 16:45:32.516319	2026-09-10 16:45:32.516319
3009	77	2	5	34	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 34.0s)	2026-09-10 16:45:32.549755	2026-09-10 16:45:32.549755
3011	77	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:32.589541	2026-09-10 16:45:32.589541
2205	78	1	3	28	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.862861	2026-09-10 16:44:34.862861
3015	78	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:32.658065	2026-09-10 16:45:32.658065
3017	78	2	2	56	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 56.0s)	2026-09-10 16:45:32.692154	2026-09-10 16:45:32.692154
3019	78	3	5	20	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 20.0s)	2026-09-10 16:45:32.722278	2026-09-10 16:45:32.722278
2208	78	4	3	52	2	2026-07-01	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.884914	2026-09-10 16:44:34.884914
3021	78	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:32.750504	2026-09-10 16:45:32.750504
2224	79	2	3	45	2	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:34.989261	2026-09-10 16:44:34.989261
3025	79	2	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:32.804107	2026-09-10 16:45:32.804107
3027	79	3	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:32.828074	2026-09-10 16:45:32.828074
3029	79	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:32.860396	2026-09-10 16:45:32.860396
3031	80	1	1	45	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 45.0s)	2026-09-10 16:45:32.894288	2026-09-10 16:45:32.894288
3035	80	3	4	38	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 38.0s)	2026-09-10 16:45:32.951063	2026-09-10 16:45:32.951063
3037	80	4	1	81	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:32.975442	2026-09-10 16:45:32.975442
3039	81	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:33.004531	2026-09-10 16:45:33.004531
3041	81	2	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:33.029831	2026-09-10 16:45:33.029831
3045	81	4	1	66	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 66.0s)	2026-09-10 16:45:33.091051	2026-09-10 16:45:33.091051
2277	82	1	5	20	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:35.333867	2026-09-10 16:44:35.333867
3047	82	1	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:33.123811	2026-09-10 16:45:33.123811
3049	82	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:33.153996	2026-09-10 16:45:33.153996
3051	82	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:33.183939	2026-09-10 16:45:33.183939
3055	83	1	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:33.238371	2026-09-10 16:45:33.238371
3057	83	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:33.267992	2026-09-10 16:45:33.267992
3059	83	3	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:33.300942	2026-09-10 16:45:33.300942
3061	83	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:33.342128	2026-09-10 16:45:33.342128
3065	84	2	2	56	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 56.0s)	2026-09-10 16:45:33.404574	2026-09-10 16:45:33.404574
3067	84	3	5	32	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 32.0s)	2026-09-10 16:45:33.439283	2026-09-10 16:45:33.439283
3069	84	4	2	54	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:33.47447	2026-09-10 16:45:33.47447
3071	85	1	5	21	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 21.0s)	2026-09-10 16:45:33.531485	2026-09-10 16:45:33.531485
2074	70	14	2	29	1	2026-08-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.202027	2026-09-10 16:44:33.202027
3233	105	2	3	48	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 48.0s)	2026-09-10 16:45:36.033137	2026-09-10 16:45:36.033137
2075	70	15	2	29	1	2026-08-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.211949	2026-09-10 16:44:33.211949
3243	106	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:36.245255	2026-09-10 16:45:36.245255
2076	70	16	2	29	1	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.219071	2026-09-10 16:44:33.219071
3253	107	4	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:36.410386	2026-09-10 16:45:36.410386
2077	70	17	1	37	1	2026-08-22	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.227994	2026-09-10 16:44:33.227994
3263	109	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:36.602312	2026-09-10 16:45:36.602312
2782	110	2	2	55	1	2026-07-01	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:38.210702	2026-09-10 16:44:38.210702
2078	70	18	3	24	1	2026-08-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.239171	2026-09-10 16:44:33.239171
3273	110	2	2	57	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 57.0s)	2026-09-10 16:45:36.770182	2026-09-10 16:45:36.770182
2960	71	1	5	20	4	2026-09-06	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:31.845392	2026-09-10 16:45:31.845392
3283	111	3	5	20	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 20.0s)	2026-09-10 16:45:36.922532	2026-09-10 16:45:36.922532
2962	71	2	4	38	4	2026-09-05	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:31.864235	2026-09-10 16:45:31.864235
3293	112	4	1	66	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 66.0s)	2026-09-10 16:45:37.076233	2026-09-10 16:45:37.076233
2964	71	3	2	29	4	2026-09-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:31.878804	2026-09-10 16:45:31.878804
3303	114	1	1	44	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 44.0s)	2026-09-10 16:45:37.24952	2026-09-10 16:45:37.24952
2966	71	4	3	52	4	2026-09-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.893057	2026-09-10 16:45:31.893057
3313	115	2	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:37.42601	2026-09-10 16:45:37.42601
2083	71	5	5	21	2	2026-09-02	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:33.294423	2026-09-10 16:44:33.294423
3323	116	3	4	38	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 38.0s)	2026-09-10 16:45:37.617101	2026-09-10 16:45:37.617101
2084	71	6	5	25	2	2026-09-01	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:33.302072	2026-09-10 16:44:33.302072
3333	117	4	3	46	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:37.800226	2026-09-10 16:45:37.800226
2085	71	7	3	84	2	2026-08-31	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.314993	2026-09-10 16:44:33.314993
2086	71	8	3	29	2	2026-08-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.326524	2026-09-10 16:44:33.326524
2087	71	9	2	29	2	2026-08-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.335584	2026-09-10 16:44:33.335584
2088	71	10	2	29	1	2026-08-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.34519	2026-09-10 16:44:33.34519
2089	71	11	3	24	1	2026-08-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.356887	2026-09-10 16:44:33.356887
2090	71	12	3	24	1	2026-08-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.366752	2026-09-10 16:44:33.366752
2091	71	13	2	29	1	2026-08-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.376851	2026-09-10 16:44:33.376851
2092	71	14	1	37	1	2026-08-24	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.383892	2026-09-10 16:44:33.383892
2093	71	15	1	37	1	2026-08-23	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.39619	2026-09-10 16:44:33.39619
2094	71	16	3	24	1	2026-08-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.40515	2026-09-10 16:44:33.40515
3075	85	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:33.58811	2026-09-10 16:45:33.58811
3077	85	4	4	39	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:33.610331	2026-09-10 16:45:33.610331
2349	86	1	4	23	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:35.748922	2026-09-10 16:44:35.748922
3079	86	1	5	25	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 25.0s)	2026-09-10 16:45:33.637602	2026-09-10 16:45:33.637602
3081	86	2	5	34	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 34.0s)	2026-09-10 16:45:33.666462	2026-09-10 16:45:33.666462
3085	86	4	4	39	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:33.709165	2026-09-10 16:45:33.709165
3087	87	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:33.733984	2026-09-10 16:45:33.733984
2368	87	2	3	45	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:35.866891	2026-09-10 16:44:35.866891
3089	87	2	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:33.757924	2026-09-10 16:45:33.757924
3091	87	3	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:33.784188	2026-09-10 16:45:33.784188
3095	88	1	3	36	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:33.839739	2026-09-10 16:45:33.839739
3097	88	2	1	71	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 71.0s)	2026-09-10 16:45:33.869669	2026-09-10 16:45:33.869669
3099	88	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:33.906916	2026-09-10 16:45:33.906916
3101	88	4	1	81	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:33.940919	2026-09-10 16:45:33.940919
3105	89	2	5	41	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 41.0s)	2026-09-10 16:45:34.001258	2026-09-10 16:45:34.001258
3107	89	3	5	32	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 32.0s)	2026-09-10 16:45:34.032164	2026-09-10 16:45:34.032164
3109	89	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:34.05841	2026-09-10 16:45:34.05841
3111	90	1	1	44	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 44.0s)	2026-09-10 16:45:34.087163	2026-09-10 16:45:34.087163
3115	90	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:34.13309	2026-09-10 16:45:34.13309
3117	90	4	1	81	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:34.169072	2026-09-10 16:45:34.169072
3119	91	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:34.194093	2026-09-10 16:45:34.194093
3121	91	2	3	48	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 48.0s)	2026-09-10 16:45:34.223976	2026-09-10 16:45:34.223976
3125	91	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:34.276854	2026-09-10 16:45:34.276854
3127	92	1	3	35	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 35.0s)	2026-09-10 16:45:34.304071	2026-09-10 16:45:34.304071
3129	92	2	3	48	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 48.0s)	2026-09-10 16:45:34.326576	2026-09-10 16:45:34.326576
3131	92	3	5	27	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 27.0s)	2026-09-10 16:45:34.356189	2026-09-10 16:45:34.356189
2475	93	1	3	28	2	2026-01-15	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:36.539834	2026-09-10 16:44:36.539834
3135	93	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:34.409827	2026-09-10 16:45:34.409827
3137	93	2	3	48	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 48.0s)	2026-09-10 16:45:34.441273	2026-09-10 16:45:34.441273
3139	93	3	5	23	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 23.0s)	2026-09-10 16:45:34.473352	2026-09-10 16:45:34.473352
3141	93	4	1	65	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 65.0s)	2026-09-10 16:45:34.504001	2026-09-10 16:45:34.504001
3145	94	2	2	56	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 56.0s)	2026-09-10 16:45:34.550442	2026-09-10 16:45:34.550442
3147	94	3	5	32	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 32.0s)	2026-09-10 16:45:34.578873	2026-09-10 16:45:34.578873
2095	71	17	2	29	1	2026-08-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.414163	2026-09-10 16:44:33.414163
3149	94	4	1	64	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 64.0s)	2026-09-10 16:45:34.618962	2026-09-10 16:45:34.618962
3151	95	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:34.658453	2026-09-10 16:45:34.658453
3155	95	3	5	23	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 23.0s)	2026-09-10 16:45:34.710265	2026-09-10 16:45:34.710265
2514	95	4	4	44	2	2026-01-15	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:36.760664	2026-09-10 16:44:36.760664
3157	95	4	3	46	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:34.737969	2026-09-10 16:45:34.737969
3159	96	1	1	43	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 43.0s)	2026-09-10 16:45:34.769881	2026-09-10 16:45:34.769881
3161	96	2	1	70	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 70.0s)	2026-09-10 16:45:34.802869	2026-09-10 16:45:34.802869
3165	96	4	1	81	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:34.862152	2026-09-10 16:45:34.862152
2547	97	1	5	20	2	2026-08-15	f	Grade A+ Certified — Master technician pace on Shoulder Join, zero-defect standard	2026-09-10 16:44:36.956387	2026-09-10 16:44:36.956387
3167	97	1	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:34.891965	2026-09-10 16:45:34.891965
3169	97	2	5	34	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 34.0s)	2026-09-10 16:45:34.92482	2026-09-10 16:45:34.92482
3171	97	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:34.954845	2026-09-10 16:45:34.954845
3175	98	1	3	36	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:35.022389	2026-09-10 16:45:35.022389
2566	98	2	2	54	1	2026-03-20	f	Grade C — Developing cross-training on Neck Rib Attach; under line supervisor coaching	2026-09-10 16:44:37.079003	2026-09-10 16:44:37.079003
3177	98	2	2	56	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 56.0s)	2026-09-10 16:45:35.060551	2026-09-10 16:45:35.060551
3179	98	3	5	31	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 31.0s)	2026-09-10 16:45:35.100125	2026-09-10 16:45:35.100125
3181	98	4	1	66	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 66.0s)	2026-09-10 16:45:35.130866	2026-09-10 16:45:35.130866
3185	99	2	3	48	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 48.0s)	2026-09-10 16:45:35.201984	2026-09-10 16:45:35.201984
3187	99	3	5	19	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 19.0s)	2026-09-10 16:45:35.233912	2026-09-10 16:45:35.233912
3189	99	4	2	54	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:35.262854	2026-09-10 16:45:35.262854
3191	100	1	3	36	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:35.288234	2026-09-10 16:45:35.288234
3195	100	3	5	31	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 31.0s)	2026-09-10 16:45:35.342224	2026-09-10 16:45:35.342224
3197	100	4	1	81	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:35.370407	2026-09-10 16:45:35.370407
2619	101	1	4	23	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Shoulder Join	2026-09-10 16:44:37.400316	2026-09-10 16:44:37.400316
3199	101	1	5	25	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 25.0s)	2026-09-10 16:45:35.410942	2026-09-10 16:45:35.410942
3201	101	2	5	34	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 34.0s)	2026-09-10 16:45:35.444173	2026-09-10 16:45:35.444173
3205	101	4	4	39	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:35.504893	2026-09-10 16:45:35.504893
3207	102	1	1	45	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 45.0s)	2026-09-10 16:45:35.535648	2026-09-10 16:45:35.535648
3209	102	2	1	70	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 70.0s)	2026-09-10 16:45:35.562315	2026-09-10 16:45:35.562315
3211	102	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:35.596584	2026-09-10 16:45:35.596584
3215	103	1	4	31	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 31.0s)	2026-09-10 16:45:35.67316	2026-09-10 16:45:35.67316
3217	103	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:35.706755	2026-09-10 16:45:35.706755
3219	103	3	5	23	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 23.0s)	2026-09-10 16:45:35.738309	2026-09-10 16:45:35.738309
2658	103	4	4	45	2	2026-07-01	f	Grade A Certified — Consistently meets 100% standard SAM on Sleeve Attach Left	2026-09-10 16:44:37.600666	2026-09-10 16:44:37.600666
3240	106	1	1	42	3	2026-08-02	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.188989	2026-09-10 16:45:36.188989
3221	103	4	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:35.774212	2026-09-10 16:45:35.774212
2674	104	2	3	45	1	2026-05-10	f	Grade B Certified — Qualified standard production pace under line balancing	2026-09-10 16:44:37.673816	2026-09-10 16:44:37.673816
3225	104	2	3	47	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:35.85583	2026-09-10 16:45:35.85583
3227	104	3	5	27	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 27.0s)	2026-09-10 16:45:35.891332	2026-09-10 16:45:35.891332
3229	104	4	2	54	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 54.0s)	2026-09-10 16:45:35.94458	2026-09-10 16:45:35.94458
3235	105	3	5	20	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 20.0s)	2026-09-10 16:45:36.071963	2026-09-10 16:45:36.071963
3237	105	4	3	46	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:36.118331	2026-09-10 16:45:36.118331
3239	106	1	3	35	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 35.0s)	2026-09-10 16:45:36.169338	2026-09-10 16:45:36.169338
3245	106	4	1	65	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 65.0s)	2026-09-10 16:45:36.276349	2026-09-10 16:45:36.276349
3247	107	1	4	30	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 30.0s)	2026-09-10 16:45:36.308472	2026-09-10 16:45:36.308472
3249	107	2	5	41	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 41.0s)	2026-09-10 16:45:36.344089	2026-09-10 16:45:36.344089
2745	108	1	2	33	1	2026-01-15	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:38.013089	2026-09-10 16:44:38.013089
3255	108	1	3	35	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 35.0s)	2026-09-10 16:45:36.45233	2026-09-10 16:45:36.45233
3257	108	2	1	71	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 71.0s)	2026-09-10 16:45:36.486627	2026-09-10 16:45:36.486627
3259	108	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:36.520292	2026-09-10 16:45:36.520292
3265	109	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:36.643202	2026-09-10 16:45:36.643202
3267	109	3	5	27	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 27.0s)	2026-09-10 16:45:36.6759	2026-09-10 16:45:36.6759
3269	109	4	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:36.709444	2026-09-10 16:45:36.709444
3275	110	3	4	38	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 38.0s)	2026-09-10 16:45:36.800742	2026-09-10 16:45:36.800742
3277	110	4	1	81	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 81.0s)	2026-09-10 16:45:36.832358	2026-09-10 16:45:36.832358
3279	111	1	5	25	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 25.0s)	2026-09-10 16:45:36.862162	2026-09-10 16:45:36.862162
3285	111	4	3	47	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 47.0s)	2026-09-10 16:45:36.946099	2026-09-10 16:45:36.946099
2817	112	1	2	33	1	2026-08-15	f	Grade C — Developing cross-training on Shoulder Join; under line supervisor coaching	2026-09-10 16:44:38.380205	2026-09-10 16:44:38.380205
3287	112	1	3	35	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 35.0s)	2026-09-10 16:45:36.971982	2026-09-10 16:45:36.971982
3289	112	2	2	57	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 57.0s)	2026-09-10 16:45:37.006	2026-09-10 16:45:37.006
3295	113	1	5	22	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:37.111943	2026-09-10 16:45:37.111943
3297	113	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:37.140791	2026-09-10 16:45:37.140791
2096	71	18	2	29	1	2026-08-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.426161	2026-09-10 16:44:33.426161
3261	108	4	1	80	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 80.0s)	2026-09-10 16:45:36.560305	2026-09-10 16:45:36.560305
2968	72	1	2	34	4	2026-09-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:31.908609	2026-09-10 16:45:31.908609
3271	110	1	3	36	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 36.0s)	2026-09-10 16:45:36.73943	2026-09-10 16:45:36.73943
2970	72	2	2	55	4	2026-09-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:31.923905	2026-09-10 16:45:31.923905
3281	111	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:36.889122	2026-09-10 16:45:36.889122
2819	112	3	2	29	1	2026-03-20	f	Grade C — Developing cross-training on Neck Top Stitch; under line supervisor coaching	2026-09-10 16:44:38.389837	2026-09-10 16:44:38.389837
2972	72	3	5	17	4	2026-09-03	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:31.942936	2026-09-10 16:45:31.942936
3291	112	3	5	31	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 31.0s)	2026-09-10 16:45:37.040996	2026-09-10 16:45:37.040996
2838	113	4	5	37	2	2026-07-01	f	Grade A+ Certified — Master technician pace on Sleeve Attach Left, zero-defect standard	2026-09-10 16:44:38.479015	2026-09-10 16:44:38.479015
2974	72	4	3	52	4	2026-09-02	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.959648	2026-09-10 16:45:31.959648
3301	113	4	4	39	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:37.206888	2026-09-10 16:45:37.206888
2101	72	5	3	29	2	2026-09-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.545903	2026-09-10 16:44:33.545903
3311	115	1	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:37.384973	2026-09-10 16:45:37.384973
2102	72	6	2	42	2	2026-08-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.56984	2026-09-10 16:44:33.56984
3321	116	2	1	70	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 70.0s)	2026-09-10 16:45:37.582303	2026-09-10 16:45:37.582303
2103	72	7	2	101	2	2026-08-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.60882	2026-09-10 16:44:33.60882
3331	117	3	5	22	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 22.0s)	2026-09-10 16:45:37.759402	2026-09-10 16:45:37.759402
2104	72	8	4	25	2	2026-08-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:33.635575	2026-09-10 16:44:33.635575
3341	118	4	3	46	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 46.0s)	2026-09-10 16:45:37.960303	2026-09-10 16:45:37.960303
2105	72	9	5	17	2	2026-08-28	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:33.653938	2026-09-10 16:44:33.653938
2106	72	10	2	29	2	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.680192	2026-09-10 16:44:33.680192
2107	72	11	2	29	2	2026-08-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.70109	2026-09-10 16:44:33.70109
2108	72	12	2	29	2	2026-08-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.721225	2026-09-10 16:44:33.721225
2109	72	13	1	37	1	2026-08-24	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.737967	2026-09-10 16:44:33.737967
2110	72	14	3	24	1	2026-08-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:33.757977	2026-09-10 16:44:33.757977
2111	72	15	2	29	1	2026-08-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.777884	2026-09-10 16:44:33.777884
2112	72	16	2	29	1	2026-08-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.798051	2026-09-10 16:44:33.798051
2113	72	17	1	37	1	2026-08-20	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.816575	2026-09-10 16:44:33.816575
2114	72	18	1	37	1	2026-08-19	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:33.831869	2026-09-10 16:44:33.831869
2976	73	1	4	24	4	2026-09-04	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:31.975761	2026-09-10 16:45:31.975761
2978	73	2	3	45	4	2026-09-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:31.993862	2026-09-10 16:45:31.993862
2980	73	3	3	24	4	2026-09-02	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:32.011111	2026-09-10 16:45:32.011111
2982	73	4	2	63	4	2026-09-01	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.030395	2026-09-10 16:45:32.030395
2119	73	5	2	35	2	2026-08-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.933077	2026-09-10 16:44:33.933077
2120	73	6	4	29	2	2026-08-30	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:33.951055	2026-09-10 16:44:33.951055
2121	73	7	5	59	2	2026-08-29	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:33.965894	2026-09-10 16:44:33.965894
2122	73	8	4	25	2	2026-08-28	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:33.982221	2026-09-10 16:44:33.982221
2123	73	9	2	29	2	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:33.997921	2026-09-10 16:44:33.997921
2124	73	10	2	29	1	2026-08-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.013058	2026-09-10 16:44:34.013058
2125	73	11	3	24	1	2026-08-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.026669	2026-09-10 16:44:34.026669
2126	73	12	3	24	1	2026-08-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.041993	2026-09-10 16:44:34.041993
2127	73	13	2	29	1	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.056809	2026-09-10 16:44:34.056809
2128	73	14	2	29	1	2026-08-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.070086	2026-09-10 16:44:34.070086
2129	73	15	1	37	1	2026-08-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:34.08315	2026-09-10 16:44:34.08315
2130	73	16	3	24	1	2026-08-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.095248	2026-09-10 16:44:34.095248
2131	73	17	3	24	1	2026-08-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.106674	2026-09-10 16:44:34.106674
2132	73	18	2	29	1	2026-08-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.116436	2026-09-10 16:44:34.116436
3299	113	3	5	27	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 27.0s)	2026-09-10 16:45:37.174044	2026-09-10 16:45:37.174044
2984	74	1	5	20	4	2026-09-03	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:32.043958	2026-09-10 16:45:32.043958
3305	114	2	1	70	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 70.0s)	2026-09-10 16:45:37.286854	2026-09-10 16:45:37.286854
2986	74	2	4	38	4	2026-09-02	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.059188	2026-09-10 16:45:32.059188
3307	114	3	3	39	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 39.0s)	2026-09-10 16:45:37.320306	2026-09-10 16:45:37.320306
2988	74	3	4	21	4	2026-09-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.076751	2026-09-10 16:45:32.076751
3309	114	4	1	64	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 64.0s)	2026-09-10 16:45:37.354102	2026-09-10 16:45:37.354102
2990	74	4	5	37	4	2026-08-31	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:32.126028	2026-09-10 16:45:32.126028
3315	115	3	5	27	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 27.0s)	2026-09-10 16:45:37.466993	2026-09-10 16:45:37.466993
2137	74	5	5	21	2	2026-08-30	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.186611	2026-09-10 16:44:34.186611
3317	115	4	1	55	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 55.0s)	2026-09-10 16:45:37.504343	2026-09-10 16:45:37.504343
2138	74	6	5	25	2	2026-08-29	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.199236	2026-09-10 16:44:34.199236
3319	116	1	1	44	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 44.0s)	2026-09-10 16:45:37.543279	2026-09-10 16:45:37.543279
2139	74	7	4	71	2	2026-08-28	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.212987	2026-09-10 16:44:34.212987
3325	116	4	1	80	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 80.0s)	2026-09-10 16:45:37.649934	2026-09-10 16:45:37.649934
2140	74	8	4	25	2	2026-08-27	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.226812	2026-09-10 16:44:34.226812
3327	117	1	5	21	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 21.0s)	2026-09-10 16:45:37.686705	2026-09-10 16:45:37.686705
2908	117	2	5	32	1	2026-01-15	f	Grade A+ Certified — Master technician pace on Neck Rib Attach, zero-defect standard	2026-09-10 16:44:38.814209	2026-09-10 16:44:38.814209
2141	74	9	5	17	2	2026-08-26	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.252032	2026-09-10 16:44:34.252032
3329	117	2	5	34	2	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 34.0s)	2026-09-10 16:45:37.722336	2026-09-10 16:45:37.722336
2142	74	10	5	17	1	2026-08-25	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.263958	2026-09-10 16:44:34.263958
3335	118	1	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:37.836552	2026-09-10 16:45:37.836552
2143	74	11	5	17	1	2026-08-24	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.280407	2026-09-10 16:44:34.280407
3337	118	2	5	40	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 40.0s)	2026-09-10 16:45:37.875165	2026-09-10 16:45:37.875165
2144	74	12	4	21	1	2026-08-23	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.292063	2026-09-10 16:44:34.292063
3339	118	3	5	26	3	2026-09-10	f	Auto-calculated from 1 submitted test(s) (Avg: 26.0s)	2026-09-10 16:45:37.919369	2026-09-10 16:45:37.919369
2145	74	13	4	21	1	2026-08-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.315364	2026-09-10 16:44:34.315364
2146	74	14	5	17	1	2026-08-21	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.330893	2026-09-10 16:44:34.330893
2147	74	15	5	17	1	2026-08-20	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.345767	2026-09-10 16:44:34.345767
2148	74	16	5	17	1	2026-08-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.360076	2026-09-10 16:44:34.360076
2149	74	17	4	21	1	2026-08-18	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.376513	2026-09-10 16:44:34.376513
2150	74	18	4	21	1	2026-08-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.384119	2026-09-10 16:44:34.384119
2992	75	1	4	24	4	2026-09-02	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.167806	2026-09-10 16:45:32.167806
2994	75	2	4	38	4	2026-09-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.234913	2026-09-10 16:45:32.234913
2996	75	3	4	21	4	2026-08-31	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.286792	2026-09-10 16:45:32.286792
2998	75	4	3	52	4	2026-08-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:32.323433	2026-09-10 16:45:32.323433
2155	75	5	2	35	2	2026-08-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.426621	2026-09-10 16:44:34.426621
2156	75	6	2	42	2	2026-08-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.434969	2026-09-10 16:44:34.434969
2157	75	7	4	71	2	2026-08-27	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.445674	2026-09-10 16:44:34.445674
2158	75	8	3	29	2	2026-08-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.454611	2026-09-10 16:44:34.454611
2159	75	9	4	21	2	2026-08-25	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.463834	2026-09-10 16:44:34.463834
2160	75	10	2	29	1	2026-08-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.470847	2026-09-10 16:44:34.470847
2161	75	11	2	29	1	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.480139	2026-09-10 16:44:34.480139
2162	75	12	3	24	1	2026-08-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.485818	2026-09-10 16:44:34.485818
2163	75	13	2	29	1	2026-08-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.495582	2026-09-10 16:44:34.495582
2164	75	14	2	29	1	2026-08-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.501883	2026-09-10 16:44:34.501883
2165	75	15	2	29	1	2026-08-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.511197	2026-09-10 16:44:34.511197
2166	75	16	1	37	1	2026-08-18	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:34.516168	2026-09-10 16:44:34.516168
2167	75	17	3	24	1	2026-08-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.52689	2026-09-10 16:44:34.52689
2168	75	18	3	24	1	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.532852	2026-09-10 16:44:34.532852
3000	76	1	3	28	4	2026-09-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:32.363614	2026-09-10 16:45:32.363614
3002	76	2	2	55	4	2026-08-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.40694	2026-09-10 16:45:32.40694
3004	76	3	2	29	4	2026-08-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.450692	2026-09-10 16:45:32.450692
3006	76	4	4	44	4	2026-08-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.494284	2026-09-10 16:45:32.494284
2173	76	5	4	25	2	2026-08-28	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.583798	2026-09-10 16:44:34.583798
2174	76	6	3	35	2	2026-08-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.594382	2026-09-10 16:44:34.594382
2175	76	7	4	71	2	2026-08-26	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.599946	2026-09-10 16:44:34.599946
2176	76	8	3	29	2	2026-08-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.609598	2026-09-10 16:44:34.609598
2177	76	9	2	29	2	2026-08-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.616214	2026-09-10 16:44:34.616214
2178	76	10	3	24	2	2026-08-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.624813	2026-09-10 16:44:34.624813
2179	76	11	3	24	2	2026-08-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.6332	2026-09-10 16:44:34.6332
2180	76	12	2	29	2	2026-08-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.64302	2026-09-10 16:44:34.64302
2181	76	13	1	37	1	2026-08-20	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:34.674108	2026-09-10 16:44:34.674108
2182	76	14	1	37	1	2026-08-19	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:34.706886	2026-09-10 16:44:34.706886
2183	76	15	3	24	1	2026-08-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.714963	2026-09-10 16:44:34.714963
2184	76	16	2	29	1	2026-08-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.722966	2026-09-10 16:44:34.722966
2185	76	17	2	29	1	2026-08-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.72938	2026-09-10 16:44:34.72938
2186	76	18	1	37	1	2026-08-15	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:34.739252	2026-09-10 16:44:34.739252
3008	77	1	4	24	4	2026-08-31	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.5349	2026-09-10 16:45:32.5349
3010	77	2	5	32	4	2026-08-30	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:32.565335	2026-09-10 16:45:32.565335
3012	77	3	5	17	4	2026-08-29	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:32.609874	2026-09-10 16:45:32.609874
3014	77	4	5	37	4	2026-08-28	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:32.643595	2026-09-10 16:45:32.643595
2191	77	5	4	25	2	2026-08-27	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.774095	2026-09-10 16:44:34.774095
2192	77	6	4	29	2	2026-08-26	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.780077	2026-09-10 16:44:34.780077
2193	77	7	5	59	2	2026-08-25	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.787926	2026-09-10 16:44:34.787926
2194	77	8	5	21	2	2026-08-24	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.793968	2026-09-10 16:44:34.793968
2195	77	9	5	17	2	2026-08-23	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.798924	2026-09-10 16:44:34.798924
2196	77	10	4	21	1	2026-08-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.806381	2026-09-10 16:44:34.806381
2197	77	11	4	21	1	2026-08-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.812916	2026-09-10 16:44:34.812916
2198	77	12	5	17	1	2026-08-20	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.818069	2026-09-10 16:44:34.818069
2199	77	13	5	17	1	2026-08-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.82516	2026-09-10 16:44:34.82516
2200	77	14	5	17	1	2026-08-18	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.830141	2026-09-10 16:44:34.830141
2201	77	15	5	17	1	2026-08-17	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.835264	2026-09-10 16:44:34.835264
2202	77	16	4	21	1	2026-08-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.842263	2026-09-10 16:44:34.842263
2203	77	17	4	21	1	2026-08-15	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.847808	2026-09-10 16:44:34.847808
2204	77	18	5	17	1	2026-08-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:34.856385	2026-09-10 16:44:34.856385
3016	78	1	3	28	4	2026-08-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:32.67437	2026-09-10 16:45:32.67437
3018	78	2	3	45	4	2026-08-29	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:32.707164	2026-09-10 16:45:32.707164
3020	78	3	4	21	4	2026-08-28	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.734712	2026-09-10 16:45:32.734712
3022	78	4	2	63	4	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.763955	2026-09-10 16:45:32.763955
2209	78	5	4	25	2	2026-08-26	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:34.892908	2026-09-10 16:44:34.892908
2210	78	6	3	35	2	2026-08-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.899972	2026-09-10 16:44:34.899972
2211	78	7	3	84	2	2026-08-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.909021	2026-09-10 16:44:34.909021
2212	78	8	2	35	2	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.915485	2026-09-10 16:44:34.915485
2213	78	9	3	24	2	2026-08-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.923999	2026-09-10 16:44:34.923999
2214	78	10	3	24	1	2026-08-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.928126	2026-09-10 16:44:34.928126
2215	78	11	3	24	1	2026-08-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.933047	2026-09-10 16:44:34.933047
2216	78	12	2	29	1	2026-08-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.94049	2026-09-10 16:44:34.94049
2217	78	13	2	29	1	2026-08-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.945801	2026-09-10 16:44:34.945801
2219	78	15	3	24	1	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.959121	2026-09-10 16:44:34.959121
2220	78	16	3	24	1	2026-08-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:34.964111	2026-09-10 16:44:34.964111
2221	78	17	2	29	1	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.968408	2026-09-10 16:44:34.968408
2222	78	18	2	29	1	2026-08-13	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:34.975764	2026-09-10 16:44:34.975764
3024	79	1	2	34	4	2026-08-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.789175	2026-09-10 16:45:32.789175
3026	79	2	2	55	4	2026-08-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.81818	2026-09-10 16:45:32.81818
3028	79	3	4	21	4	2026-08-27	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:32.844458	2026-09-10 16:45:32.844458
3030	79	4	3	52	4	2026-08-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:32.883019	2026-09-10 16:45:32.883019
2227	79	5	3	29	2	2026-08-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.012969	2026-09-10 16:44:35.012969
2228	79	6	2	42	2	2026-08-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.020762	2026-09-10 16:44:35.020762
2229	79	7	3	84	2	2026-08-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.026125	2026-09-10 16:44:35.026125
2230	79	8	5	21	2	2026-08-22	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.03247	2026-09-10 16:44:35.03247
2231	79	9	3	24	2	2026-08-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.042097	2026-09-10 16:44:35.042097
2232	79	10	2	29	1	2026-08-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.048159	2026-09-10 16:44:35.048159
2233	79	11	2	29	1	2026-08-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.054171	2026-09-10 16:44:35.054171
2234	79	12	2	29	1	2026-08-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.061887	2026-09-10 16:44:35.061887
2235	79	13	3	24	1	2026-08-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.067197	2026-09-10 16:44:35.067197
2236	79	14	3	24	1	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.075263	2026-09-10 16:44:35.075263
2237	79	15	2	29	1	2026-08-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.080829	2026-09-10 16:44:35.080829
2238	79	16	2	29	1	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.086419	2026-09-10 16:44:35.086419
2239	79	17	1	37	1	2026-08-13	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.091972	2026-09-10 16:44:35.091972
2240	79	18	3	24	1	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.100902	2026-09-10 16:44:35.100902
3032	80	1	2	34	4	2026-08-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.910849	2026-09-10 16:45:32.910849
3034	80	2	2	55	4	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:32.937084	2026-09-10 16:45:32.937084
3036	80	3	1	37	4	2026-08-26	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:32.96323	2026-09-10 16:45:32.96323
3038	80	4	1	79	4	2026-08-25	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:32.989767	2026-09-10 16:45:32.989767
2245	80	5	1	44	2	2026-08-24	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.136754	2026-09-10 16:44:35.136754
2246	80	6	2	42	2	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.145056	2026-09-10 16:44:35.145056
2247	80	7	2	101	2	2026-08-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.150995	2026-09-10 16:44:35.150995
2248	80	8	1	44	2	2026-08-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.159247	2026-09-10 16:44:35.159247
2249	80	9	1	37	2	2026-08-20	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.164795	2026-09-10 16:44:35.164795
2250	80	10	1	37	2	2026-08-19	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.170357	2026-09-10 16:44:35.170357
2251	80	11	3	24	2	2026-08-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.179121	2026-09-10 16:44:35.179121
2252	80	12	2	29	2	2026-08-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.183121	2026-09-10 16:44:35.183121
2253	80	13	1	37	1	2026-08-16	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.190184	2026-09-10 16:44:35.190184
2254	80	14	1	37	1	2026-08-15	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.194728	2026-09-10 16:44:35.194728
2255	80	15	1	37	1	2026-08-14	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.205521	2026-09-10 16:44:35.205521
2256	80	16	3	24	1	2026-08-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.211086	2026-09-10 16:44:35.211086
2257	80	17	3	24	1	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.215672	2026-09-10 16:44:35.215672
2258	80	18	3	24	1	2026-08-11	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.22179	2026-09-10 16:44:35.22179
3040	81	1	2	34	4	2026-08-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.017841	2026-09-10 16:45:33.017841
3042	81	2	2	55	4	2026-08-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.044135	2026-09-10 16:45:33.044135
3044	81	3	3	24	4	2026-08-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.076947	2026-09-10 16:45:33.076947
3046	81	4	3	52	4	2026-08-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.108084	2026-09-10 16:45:33.108084
2263	81	5	3	29	2	2026-08-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.256688	2026-09-10 16:44:35.256688
2264	81	6	2	42	2	2026-08-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.262246	2026-09-10 16:44:35.262246
2265	81	7	2	101	2	2026-08-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.270042	2026-09-10 16:44:35.270042
2266	81	8	3	29	2	2026-08-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.276783	2026-09-10 16:44:35.276783
2267	81	9	3	24	2	2026-08-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.283254	2026-09-10 16:44:35.283254
2268	81	10	5	17	1	2026-08-18	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.288991	2026-09-10 16:44:35.288991
2269	81	11	3	24	1	2026-08-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.293982	2026-09-10 16:44:35.293982
2270	81	12	4	21	1	2026-08-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.299306	2026-09-10 16:44:35.299306
2271	81	13	2	29	1	2026-08-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.304574	2026-09-10 16:44:35.304574
2272	81	14	5	17	1	2026-08-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.30937	2026-09-10 16:44:35.30937
2273	81	15	5	17	1	2026-08-13	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.314021	2026-09-10 16:44:35.314021
2274	81	16	3	24	1	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.318347	2026-09-10 16:44:35.318347
2275	81	17	3	24	1	2026-08-11	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.324759	2026-09-10 16:44:35.324759
2276	81	18	2	29	1	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.328573	2026-09-10 16:44:35.328573
3048	82	1	5	20	4	2026-08-26	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.137133	2026-09-10 16:45:33.137133
3050	82	2	5	32	4	2026-08-25	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.169719	2026-09-10 16:45:33.169719
3052	82	3	5	17	4	2026-08-24	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.197298	2026-09-10 16:45:33.197298
3054	82	4	4	44	4	2026-08-23	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.224125	2026-09-10 16:45:33.224125
2281	82	5	4	25	2	2026-08-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.36039	2026-09-10 16:44:35.36039
2282	82	6	5	25	2	2026-08-21	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.365807	2026-09-10 16:44:35.365807
2283	82	7	5	59	2	2026-08-20	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.372814	2026-09-10 16:44:35.372814
2284	82	8	5	21	2	2026-08-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.378112	2026-09-10 16:44:35.378112
2285	82	9	4	21	2	2026-08-18	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.383826	2026-09-10 16:44:35.383826
2286	82	10	4	21	1	2026-08-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.390041	2026-09-10 16:44:35.390041
2287	82	11	5	17	1	2026-08-16	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.395151	2026-09-10 16:44:35.395151
2288	82	12	5	17	1	2026-08-15	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.400161	2026-09-10 16:44:35.400161
2289	82	13	5	17	1	2026-08-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.406664	2026-09-10 16:44:35.406664
2290	82	14	5	17	1	2026-08-13	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.412215	2026-09-10 16:44:35.412215
2291	82	15	4	21	1	2026-08-12	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.416513	2026-09-10 16:44:35.416513
2292	82	16	4	21	1	2026-08-11	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.425426	2026-09-10 16:44:35.425426
2293	82	17	5	17	1	2026-08-10	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.429996	2026-09-10 16:44:35.429996
2294	82	18	5	17	1	2026-08-09	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.434049	2026-09-10 16:44:35.434049
3056	83	1	4	24	4	2026-08-25	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.254389	2026-09-10 16:45:33.254389
3058	83	2	4	38	4	2026-08-24	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.284897	2026-09-10 16:45:33.284897
3060	83	3	2	29	4	2026-08-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.316874	2026-09-10 16:45:33.316874
3062	83	4	5	37	4	2026-08-22	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.357932	2026-09-10 16:45:33.357932
2299	83	5	5	21	2	2026-08-21	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.487269	2026-09-10 16:44:35.487269
2300	83	6	4	29	2	2026-08-20	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.493794	2026-09-10 16:44:35.493794
2301	83	7	2	101	2	2026-08-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.500034	2026-09-10 16:44:35.500034
2302	83	8	2	35	2	2026-08-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.506442	2026-09-10 16:44:35.506442
2303	83	9	4	21	2	2026-08-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.512976	2026-09-10 16:44:35.512976
2304	83	10	3	24	1	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.518147	2026-09-10 16:44:35.518147
2305	83	11	2	29	1	2026-08-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.525683	2026-09-10 16:44:35.525683
2306	83	12	2	29	1	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.530219	2026-09-10 16:44:35.530219
2307	83	13	1	37	1	2026-08-13	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.534244	2026-09-10 16:44:35.534244
2308	83	14	3	24	1	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.543019	2026-09-10 16:44:35.543019
2309	83	15	3	24	1	2026-08-11	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.546499	2026-09-10 16:44:35.546499
2310	83	16	2	29	1	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.551196	2026-09-10 16:44:35.551196
2311	83	17	2	29	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.558174	2026-09-10 16:44:35.558174
2312	83	18	1	37	1	2026-08-08	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.562272	2026-09-10 16:44:35.562272
3064	84	1	2	34	3	2026-08-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.389632	2026-09-10 16:45:33.389632
3066	84	2	3	45	3	2026-08-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.421994	2026-09-10 16:45:33.421994
3068	84	3	3	24	3	2026-08-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.458054	2026-09-10 16:45:33.458054
3070	84	4	2	63	3	2026-08-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.505954	2026-09-10 16:45:33.505954
2317	84	5	2	35	1	2026-08-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.588181	2026-09-10 16:44:35.588181
2318	84	6	2	42	1	2026-08-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.592824	2026-09-10 16:44:35.592824
2319	84	7	3	84	1	2026-08-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.596451	2026-09-10 16:44:35.596451
2320	84	8	3	29	1	2026-08-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.601065	2026-09-10 16:44:35.601065
2321	84	9	2	29	1	2026-08-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.608352	2026-09-10 16:44:35.608352
2322	84	10	4	21	2	2026-08-15	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.611999	2026-09-10 16:44:35.611999
2323	84	11	2	29	1	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.615657	2026-09-10 16:44:35.615657
2324	84	12	5	17	2	2026-08-13	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.621974	2026-09-10 16:44:35.621974
2325	84	13	4	21	1	2026-08-12	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.626263	2026-09-10 16:44:35.626263
2326	84	14	5	17	2	2026-08-11	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.630981	2026-09-10 16:44:35.630981
2327	84	15	4	21	2	2026-08-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.636591	2026-09-10 16:44:35.636591
2328	84	16	2	29	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.642206	2026-09-10 16:44:35.642206
2329	84	17	4	21	1	2026-08-08	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.645904	2026-09-10 16:44:35.645904
2330	84	18	4	21	1	2026-08-07	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.64892	2026-09-10 16:44:35.64892
3072	85	1	5	20	4	2026-08-23	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.546377	2026-09-10 16:45:33.546377
3074	85	2	4	38	4	2026-08-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.574951	2026-09-10 16:45:33.574951
3076	85	3	4	21	4	2026-08-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.600645	2026-09-10 16:45:33.600645
3078	85	4	5	37	4	2026-08-20	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.624446	2026-09-10 16:45:33.624446
2335	85	5	5	21	2	2026-08-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.676335	2026-09-10 16:44:35.676335
2336	85	6	5	25	2	2026-08-18	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.681682	2026-09-10 16:44:35.681682
2337	85	7	5	59	2	2026-08-17	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.688048	2026-09-10 16:44:35.688048
2338	85	8	4	25	2	2026-08-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.693102	2026-09-10 16:44:35.693102
2339	85	9	4	21	2	2026-08-15	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.69837	2026-09-10 16:44:35.69837
2340	85	10	5	17	1	2026-08-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.704053	2026-09-10 16:44:35.704053
2341	85	11	5	17	1	2026-08-13	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.710235	2026-09-10 16:44:35.710235
2342	85	12	5	17	1	2026-08-12	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.71438	2026-09-10 16:44:35.71438
2343	85	13	4	21	1	2026-08-11	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.722007	2026-09-10 16:44:35.722007
2344	85	14	4	21	1	2026-08-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.725709	2026-09-10 16:44:35.725709
2345	85	15	5	17	1	2026-08-09	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.730395	2026-09-10 16:44:35.730395
2346	85	16	5	17	1	2026-08-08	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.73396	2026-09-10 16:44:35.73396
2347	85	17	5	17	1	2026-08-07	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:35.741223	2026-09-10 16:44:35.741223
2348	85	18	4	21	1	2026-08-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.744927	2026-09-10 16:44:35.744927
3080	86	1	3	28	4	2026-08-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.65215	2026-09-10 16:45:33.65215
3082	86	2	5	32	4	2026-08-21	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.676314	2026-09-10 16:45:33.676314
3084	86	3	3	24	4	2026-08-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.699346	2026-09-10 16:45:33.699346
3086	86	4	4	44	4	2026-08-19	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.721629	2026-09-10 16:45:33.721629
2353	86	5	4	25	2	2026-08-18	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.775394	2026-09-10 16:44:35.775394
2354	86	6	3	35	2	2026-08-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.78034	2026-09-10 16:44:35.78034
2355	86	7	4	71	2	2026-08-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.786522	2026-09-10 16:44:35.786522
2356	86	8	4	25	2	2026-08-15	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.794612	2026-09-10 16:44:35.794612
2357	86	9	3	24	2	2026-08-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.801161	2026-09-10 16:44:35.801161
2358	86	10	2	29	1	2026-08-13	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.807851	2026-09-10 16:44:35.807851
2359	86	11	2	29	1	2026-08-12	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.813077	2026-09-10 16:44:35.813077
2360	86	12	2	29	1	2026-08-11	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.820437	2026-09-10 16:44:35.820437
2361	86	13	3	24	1	2026-08-10	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.826047	2026-09-10 16:44:35.826047
2362	86	14	2	29	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.831032	2026-09-10 16:44:35.831032
2363	86	15	2	29	1	2026-08-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.837127	2026-09-10 16:44:35.837127
2364	86	16	1	37	1	2026-08-07	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.843158	2026-09-10 16:44:35.843158
2365	86	17	1	37	1	2026-08-06	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.848193	2026-09-10 16:44:35.848193
2366	86	18	3	24	1	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.855272	2026-09-10 16:44:35.855272
3088	87	1	3	28	4	2026-08-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.74421	2026-09-10 16:45:33.74421
3090	87	2	3	45	4	2026-08-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:33.772866	2026-09-10 16:45:33.772866
3092	87	3	4	21	4	2026-08-19	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:33.79403	2026-09-10 16:45:33.79403
3094	87	4	2	63	4	2026-08-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.825003	2026-09-10 16:45:33.825003
2371	87	5	4	25	2	2026-08-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:35.883783	2026-09-10 16:44:35.883783
2372	87	6	3	35	2	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.891798	2026-09-10 16:44:35.891798
2373	87	7	3	84	2	2026-08-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.896604	2026-09-10 16:44:35.896604
2374	87	8	3	29	2	2026-08-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.903818	2026-09-10 16:44:35.903818
2375	87	9	3	24	2	2026-08-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.910104	2026-09-10 16:44:35.910104
2376	87	10	3	24	1	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.914671	2026-09-10 16:44:35.914671
2377	87	11	3	24	1	2026-08-11	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.922708	2026-09-10 16:44:35.922708
2378	87	12	2	29	1	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.927233	2026-09-10 16:44:35.927233
2379	87	13	2	29	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.931757	2026-09-10 16:44:35.931757
2380	87	14	1	37	1	2026-08-08	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.939048	2026-09-10 16:44:35.939048
2381	87	15	1	37	1	2026-08-07	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.943813	2026-09-10 16:44:35.943813
2382	87	16	3	24	1	2026-08-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:35.94792	2026-09-10 16:44:35.94792
2383	87	17	2	29	1	2026-08-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.954839	2026-09-10 16:44:35.954839
2384	87	18	2	29	1	2026-08-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:35.959648	2026-09-10 16:44:35.959648
3096	88	1	1	42	3	2026-08-20	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:33.854769	2026-09-10 16:45:33.854769
3098	88	2	1	68	3	2026-08-19	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:33.887544	2026-09-10 16:45:33.887544
3100	88	3	2	29	3	2026-08-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.924933	2026-09-10 16:45:33.924933
3102	88	4	2	63	3	2026-08-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:33.957551	2026-09-10 16:45:33.957551
2389	88	5	1	44	1	2026-08-16	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.98676	2026-09-10 16:44:35.98676
2390	88	6	1	53	1	2026-08-15	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.991841	2026-09-10 16:44:35.991841
2391	88	7	1	126	1	2026-08-14	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:35.996462	2026-09-10 16:44:35.996462
2392	88	8	2	35	1	2026-08-13	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.003095	2026-09-10 16:44:36.003095
2393	88	9	2	29	2	2026-08-12	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.010169	2026-09-10 16:44:36.010169
2394	88	10	3	24	1	2026-08-11	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.014761	2026-09-10 16:44:36.014761
2395	88	11	4	21	2	2026-08-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.024857	2026-09-10 16:44:36.024857
2396	88	12	2	29	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.029883	2026-09-10 16:44:36.029883
2397	88	13	5	17	2	2026-08-08	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.042094	2026-09-10 16:44:36.042094
2398	88	14	3	24	1	2026-08-07	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.046616	2026-09-10 16:44:36.046616
2399	88	15	3	24	1	2026-08-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.050344	2026-09-10 16:44:36.050344
2400	88	16	4	21	2	2026-08-05	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.059852	2026-09-10 16:44:36.059852
2401	88	17	3	24	2	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.066979	2026-09-10 16:44:36.066979
2402	88	18	3	24	2	2026-08-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.073951	2026-09-10 16:44:36.073951
3104	89	1	5	20	4	2026-08-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:33.986852	2026-09-10 16:45:33.986852
3106	89	2	4	38	4	2026-08-18	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.016538	2026-09-10 16:45:34.016538
3108	89	3	3	24	4	2026-08-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.049687	2026-09-10 16:45:34.049687
3110	89	4	3	52	4	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.07194	2026-09-10 16:45:34.07194
2408	89	6	5	25	2	2026-08-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.12295	2026-09-10 16:44:36.12295
2409	89	7	3	84	2	2026-08-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.130061	2026-09-10 16:44:36.130061
2410	89	8	3	29	2	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.14176	2026-09-10 16:44:36.14176
2411	89	9	2	29	2	2026-08-11	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.149894	2026-09-10 16:44:36.149894
2412	89	10	2	29	1	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.162992	2026-09-10 16:44:36.162992
2413	89	11	3	24	1	2026-08-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.170169	2026-09-10 16:44:36.170169
2414	89	12	3	24	1	2026-08-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.176678	2026-09-10 16:44:36.176678
2415	89	13	2	29	1	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.183764	2026-09-10 16:44:36.183764
2416	89	14	2	29	1	2026-08-06	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.192911	2026-09-10 16:44:36.192911
2417	89	15	1	37	1	2026-08-05	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.200233	2026-09-10 16:44:36.200233
2418	89	16	3	24	1	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.209869	2026-09-10 16:44:36.209869
2419	89	17	3	24	1	2026-08-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.218075	2026-09-10 16:44:36.218075
2420	89	18	2	29	1	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.225987	2026-09-10 16:44:36.225987
3112	90	1	1	42	3	2026-08-18	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.099473	2026-09-10 16:45:34.099473
3114	90	2	1	68	3	2026-08-17	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.123279	2026-09-10 16:45:34.123279
3116	90	3	2	29	3	2026-08-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.150268	2026-09-10 16:45:34.150268
3118	90	4	2	63	3	2026-08-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.182111	2026-09-10 16:45:34.182111
2425	90	5	2	35	1	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.255997	2026-09-10 16:44:36.255997
2426	90	6	1	53	1	2026-08-13	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.263684	2026-09-10 16:44:36.263684
2427	90	7	1	126	1	2026-08-12	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.268219	2026-09-10 16:44:36.268219
2428	90	8	1	44	1	2026-08-11	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.275288	2026-09-10 16:44:36.275288
2429	90	9	2	29	2	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.280516	2026-09-10 16:44:36.280516
2430	90	10	3	24	1	2026-08-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.288193	2026-09-10 16:44:36.288193
2431	90	11	4	21	2	2026-08-08	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.292992	2026-09-10 16:44:36.292992
2432	90	12	2	29	1	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.296642	2026-09-10 16:44:36.296642
2433	90	13	3	24	2	2026-08-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.301833	2026-09-10 16:44:36.301833
2434	90	14	3	24	1	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.308108	2026-09-10 16:44:36.308108
2435	90	15	3	24	1	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.311216	2026-09-10 16:44:36.311216
2436	90	16	4	21	2	2026-08-03	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.315953	2026-09-10 16:44:36.315953
2437	90	17	4	21	2	2026-08-02	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.321977	2026-09-10 16:44:36.321977
2438	90	18	3	24	2	2026-08-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.3266	2026-09-10 16:44:36.3266
3120	91	1	4	24	4	2026-08-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.208146	2026-09-10 16:45:34.208146
3122	91	2	3	45	4	2026-08-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.2402	2026-09-10 16:45:34.2402
3124	91	3	3	24	4	2026-08-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.266892	2026-09-10 16:45:34.266892
3126	91	4	3	52	4	2026-08-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.289923	2026-09-10 16:45:34.289923
2443	91	5	2	35	2	2026-08-13	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.350426	2026-09-10 16:44:36.350426
2444	91	6	4	29	2	2026-08-12	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.35844	2026-09-10 16:44:36.35844
2445	91	7	5	59	2	2026-08-11	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.362133	2026-09-10 16:44:36.362133
2446	91	8	4	25	2	2026-08-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.366932	2026-09-10 16:44:36.366932
2447	91	9	3	24	2	2026-08-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.373941	2026-09-10 16:44:36.373941
2448	91	10	2	29	1	2026-08-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.379347	2026-09-10 16:44:36.379347
2449	91	11	2	29	1	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.381953	2026-09-10 16:44:36.381953
2450	91	12	3	24	1	2026-08-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.389065	2026-09-10 16:44:36.389065
2451	91	13	2	29	1	2026-08-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.403971	2026-09-10 16:44:36.403971
2452	91	14	2	29	1	2026-08-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.407979	2026-09-10 16:44:36.407979
2453	91	15	1	37	1	2026-08-03	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.411853	2026-09-10 16:44:36.411853
2454	91	16	1	37	1	2026-08-02	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.416004	2026-09-10 16:44:36.416004
2455	91	17	3	24	1	2026-08-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.422104	2026-09-10 16:44:36.422104
2456	91	18	2	29	1	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.426416	2026-09-10 16:44:36.426416
3128	92	1	2	34	3	2026-08-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.318063	2026-09-10 16:45:34.318063
3130	92	2	2	55	3	2026-08-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.340535	2026-09-10 16:45:34.340535
3132	92	3	2	29	3	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.370491	2026-09-10 16:45:34.370491
3134	92	4	3	52	3	2026-08-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.395918	2026-09-10 16:45:34.395918
2461	92	5	3	29	1	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.457898	2026-09-10 16:44:36.457898
2462	92	6	3	35	1	2026-08-11	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.464461	2026-09-10 16:44:36.464461
2463	92	7	2	101	1	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.470036	2026-09-10 16:44:36.470036
2464	92	8	2	35	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.475551	2026-09-10 16:44:36.475551
2465	92	9	3	24	1	2026-08-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.480099	2026-09-10 16:44:36.480099
2466	92	10	5	17	2	2026-08-07	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.486554	2026-09-10 16:44:36.486554
2467	92	11	3	24	1	2026-08-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.493074	2026-09-10 16:44:36.493074
2468	92	12	5	17	2	2026-08-05	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.498171	2026-09-10 16:44:36.498171
2469	92	13	3	24	1	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.5047	2026-09-10 16:44:36.5047
2470	92	14	4	21	2	2026-08-03	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.511723	2026-09-10 16:44:36.511723
2471	92	15	5	17	2	2026-08-02	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.516907	2026-09-10 16:44:36.516907
2472	92	16	4	21	1	2026-08-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.522893	2026-09-10 16:44:36.522893
2473	92	17	3	24	1	2026-07-31	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.52628	2026-09-10 16:44:36.52628
2474	92	18	3	24	1	2026-07-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.531794	2026-09-10 16:44:36.531794
3136	93	1	2	34	4	2026-08-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.424838	2026-09-10 16:45:34.424838
3138	93	2	4	38	4	2026-08-14	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.457855	2026-09-10 16:45:34.457855
3140	93	3	5	17	4	2026-08-13	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:34.489087	2026-09-10 16:45:34.489087
3142	93	4	3	52	4	2026-08-12	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.517112	2026-09-10 16:45:34.517112
2479	93	5	2	35	2	2026-08-11	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.563947	2026-09-10 16:44:36.563947
2480	93	6	2	42	2	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.57204	2026-09-10 16:44:36.57204
2481	93	7	4	71	2	2026-08-09	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.576823	2026-09-10 16:44:36.576823
2482	93	8	3	29	2	2026-08-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.58182	2026-09-10 16:44:36.58182
2483	93	9	4	21	2	2026-08-07	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.589065	2026-09-10 16:44:36.589065
2484	93	10	2	29	1	2026-08-06	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.593077	2026-09-10 16:44:36.593077
2485	93	11	2	29	1	2026-08-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.598234	2026-09-10 16:44:36.598234
2486	93	12	3	24	1	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.604957	2026-09-10 16:44:36.604957
2487	93	13	3	24	1	2026-08-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.610397	2026-09-10 16:44:36.610397
2488	93	14	2	29	1	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.614038	2026-09-10 16:44:36.614038
2489	93	15	2	29	1	2026-08-01	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.619379	2026-09-10 16:44:36.619379
2490	93	16	1	37	1	2026-07-31	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.624721	2026-09-10 16:44:36.624721
2491	93	17	1	37	1	2026-07-30	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.629812	2026-09-10 16:44:36.629812
2492	93	18	3	24	1	2026-07-29	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.63421	2026-09-10 16:44:36.63421
3144	94	1	2	34	3	2026-08-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.537988	2026-09-10 16:45:34.537988
3146	94	2	1	68	3	2026-08-13	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.563101	2026-09-10 16:45:34.563101
3148	94	3	1	37	3	2026-08-12	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.598941	2026-09-10 16:45:34.598941
3150	94	4	1	79	3	2026-08-11	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.638191	2026-09-10 16:45:34.638191
2497	94	5	2	35	1	2026-08-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.66376	2026-09-10 16:44:36.66376
2498	94	6	2	42	1	2026-08-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.667796	2026-09-10 16:44:36.667796
2499	94	7	1	126	1	2026-08-08	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.67432	2026-09-10 16:44:36.67432
2500	94	8	1	44	1	2026-08-07	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.678888	2026-09-10 16:44:36.678888
2501	94	9	1	37	2	2026-08-06	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.683892	2026-09-10 16:44:36.683892
2502	94	10	3	24	1	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.693852	2026-09-10 16:44:36.693852
2503	94	11	5	17	2	2026-08-04	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.6989	2026-09-10 16:44:36.6989
2504	94	12	3	24	1	2026-08-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.705297	2026-09-10 16:44:36.705297
2505	94	13	4	21	2	2026-08-02	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.710965	2026-09-10 16:44:36.710965
2506	94	14	2	29	1	2026-08-01	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.714588	2026-09-10 16:44:36.714588
2507	94	15	3	24	1	2026-07-31	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.720348	2026-09-10 16:44:36.720348
2508	94	16	5	17	2	2026-07-30	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.727221	2026-09-10 16:44:36.727221
2509	94	17	4	21	2	2026-07-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.731198	2026-09-10 16:44:36.731198
2510	94	18	4	21	2	2026-07-28	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.739298	2026-09-10 16:44:36.739298
3152	95	1	3	28	4	2026-08-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:34.672875	2026-09-10 16:45:34.672875
3154	95	2	5	32	4	2026-08-12	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:34.701147	2026-09-10 16:45:34.701147
3156	95	3	4	21	4	2026-08-11	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.724851	2026-09-10 16:45:34.724851
3158	95	4	4	44	4	2026-08-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.752643	2026-09-10 16:45:34.752643
2515	95	5	4	25	2	2026-08-09	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.766776	2026-09-10 16:44:36.766776
2516	95	6	3	35	2	2026-08-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.774301	2026-09-10 16:44:36.774301
2517	95	7	2	101	2	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.779877	2026-09-10 16:44:36.779877
2518	95	8	4	25	2	2026-08-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.784438	2026-09-10 16:44:36.784438
2519	95	9	3	24	2	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.791156	2026-09-10 16:44:36.791156
2520	95	10	2	29	1	2026-08-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.795443	2026-09-10 16:44:36.795443
2521	95	11	2	29	1	2026-08-03	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.800019	2026-09-10 16:44:36.800019
2522	95	12	2	29	1	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.806914	2026-09-10 16:44:36.806914
2523	95	13	3	24	1	2026-08-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.812011	2026-09-10 16:44:36.812011
2524	95	14	2	29	1	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.815581	2026-09-10 16:44:36.815581
2525	95	15	2	29	1	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.822029	2026-09-10 16:44:36.822029
2526	95	16	2	29	1	2026-07-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.8266	2026-09-10 16:44:36.8266
2527	95	17	1	37	1	2026-07-28	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.83073	2026-09-10 16:44:36.83073
2528	95	18	3	24	1	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.838337	2026-09-10 16:44:36.838337
3160	96	1	2	34	3	2026-08-12	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:34.785519	2026-09-10 16:45:34.785519
3162	96	2	1	68	3	2026-08-11	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.818251	2026-09-10 16:45:34.818251
3164	96	3	1	37	3	2026-08-10	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.844126	2026-09-10 16:45:34.844126
3166	96	4	1	79	3	2026-08-09	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:34.87681	2026-09-10 16:45:34.87681
2533	96	5	2	35	1	2026-08-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.866698	2026-09-10 16:44:36.866698
2534	96	6	2	42	1	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.873944	2026-09-10 16:44:36.873944
2535	96	7	1	126	1	2026-08-06	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.879959	2026-09-10 16:44:36.879959
2536	96	8	1	44	1	2026-08-05	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.884485	2026-09-10 16:44:36.884485
2537	96	9	1	37	2	2026-08-04	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:36.891756	2026-09-10 16:44:36.891756
2538	96	10	2	29	1	2026-08-03	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.896375	2026-09-10 16:44:36.896375
2539	96	11	5	17	2	2026-08-02	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.903043	2026-09-10 16:44:36.903043
2540	96	12	3	24	1	2026-08-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:36.910172	2026-09-10 16:44:36.910172
2541	96	13	4	21	2	2026-07-31	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.916613	2026-09-10 16:44:36.916613
2542	96	14	2	29	1	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.923843	2026-09-10 16:44:36.923843
2543	96	15	2	29	1	2026-07-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:36.929375	2026-09-10 16:44:36.929375
2544	96	16	5	17	2	2026-07-28	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.934435	2026-09-10 16:44:36.934435
2545	96	17	5	17	2	2026-07-27	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.943036	2026-09-10 16:44:36.943036
2546	96	18	4	21	2	2026-07-26	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.948355	2026-09-10 16:44:36.948355
3168	97	1	4	24	4	2026-08-11	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.910249	2026-09-10 16:45:34.910249
3170	97	2	4	38	4	2026-08-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:34.939421	2026-09-10 16:45:34.939421
3172	97	3	5	17	4	2026-08-09	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:34.969273	2026-09-10 16:45:34.969273
3174	97	4	5	37	4	2026-08-08	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:35.004869	2026-09-10 16:45:35.004869
2551	97	5	5	21	2	2026-08-07	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:36.982812	2026-09-10 16:44:36.982812
2552	97	6	4	29	2	2026-08-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.990945	2026-09-10 16:44:36.990945
2553	97	7	4	71	2	2026-08-05	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:36.998236	2026-09-10 16:44:36.998236
2554	97	8	5	21	2	2026-08-04	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.006246	2026-09-10 16:44:37.006246
2555	97	9	5	17	2	2026-08-03	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.010333	2026-09-10 16:44:37.010333
2556	97	10	5	17	1	2026-08-02	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.016581	2026-09-10 16:44:37.016581
2557	97	11	4	21	1	2026-08-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.024835	2026-09-10 16:44:37.024835
2558	97	12	4	21	1	2026-07-31	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.029942	2026-09-10 16:44:37.029942
2559	97	13	4	21	1	2026-07-30	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.035955	2026-09-10 16:44:37.035955
2560	97	14	5	17	1	2026-07-29	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.045019	2026-09-10 16:44:37.045019
2561	97	15	5	17	1	2026-07-28	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.05002	2026-09-10 16:44:37.05002
2562	97	16	5	17	1	2026-07-27	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.056912	2026-09-10 16:44:37.056912
2563	97	17	4	21	1	2026-07-26	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.061941	2026-09-10 16:44:37.061941
2564	97	18	4	21	1	2026-07-25	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.066514	2026-09-10 16:44:37.066514
3176	98	1	3	28	3	2026-08-10	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.041363	2026-09-10 16:45:35.041363
3178	98	2	3	45	3	2026-08-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.080468	2026-09-10 16:45:35.080468
3180	98	3	2	29	3	2026-08-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.116573	2026-09-10 16:45:35.116573
3182	98	4	2	63	3	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.149276	2026-09-10 16:45:35.149276
2569	98	5	2	35	1	2026-08-06	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.096116	2026-09-10 16:44:37.096116
2570	98	6	3	35	1	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.10113	2026-09-10 16:44:37.10113
2571	98	7	3	84	1	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.108181	2026-09-10 16:44:37.108181
2572	98	8	3	29	1	2026-08-03	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.112203	2026-09-10 16:44:37.112203
2573	98	9	2	29	1	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.116732	2026-09-10 16:44:37.116732
2574	98	10	4	21	2	2026-08-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.126313	2026-09-10 16:44:37.126313
2575	98	11	4	21	1	2026-07-31	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.130317	2026-09-10 16:44:37.130317
2576	98	12	5	17	2	2026-07-30	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.138927	2026-09-10 16:44:37.138927
2577	98	13	3	24	1	2026-07-29	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.143931	2026-09-10 16:44:37.143931
2578	98	14	5	17	2	2026-07-28	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.149992	2026-09-10 16:44:37.149992
2579	98	15	4	21	2	2026-07-27	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.159055	2026-09-10 16:44:37.159055
2580	98	16	4	21	1	2026-07-26	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.163123	2026-09-10 16:44:37.163123
2581	98	17	4	21	1	2026-07-25	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.168733	2026-09-10 16:44:37.168733
2582	98	18	4	21	1	2026-07-24	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.17538	2026-09-10 16:44:37.17538
3184	99	1	3	28	4	2026-08-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.184483	2026-09-10 16:45:35.184483
3186	99	2	2	55	4	2026-08-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.218994	2026-09-10 16:45:35.218994
3188	99	3	3	24	4	2026-08-07	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.251016	2026-09-10 16:45:35.251016
3190	99	4	4	44	4	2026-08-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:35.275504	2026-09-10 16:45:35.275504
2587	99	5	3	29	2	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.214667	2026-09-10 16:44:37.214667
2588	99	6	3	35	2	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.222199	2026-09-10 16:44:37.222199
2589	99	7	2	101	2	2026-08-03	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.229739	2026-09-10 16:44:37.229739
2590	99	8	2	35	2	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.239055	2026-09-10 16:44:37.239055
2591	99	9	5	17	2	2026-08-01	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.250274	2026-09-10 16:44:37.250274
2592	99	10	3	24	1	2026-07-31	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.261187	2026-09-10 16:44:37.261187
2593	99	11	2	29	1	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.268512	2026-09-10 16:44:37.268512
2594	99	12	2	29	1	2026-07-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.275104	2026-09-10 16:44:37.275104
2595	99	13	1	37	1	2026-07-28	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.280108	2026-09-10 16:44:37.280108
2596	99	14	3	24	1	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.284733	2026-09-10 16:44:37.284733
2597	99	15	3	24	1	2026-07-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.291827	2026-09-10 16:44:37.291827
2598	99	16	2	29	1	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.295424	2026-09-10 16:44:37.295424
2599	99	17	2	29	1	2026-07-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.300086	2026-09-10 16:44:37.300086
2600	99	18	1	37	1	2026-07-23	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.306785	2026-09-10 16:44:37.306785
3192	100	1	2	34	3	2026-08-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.304033	2026-09-10 16:45:35.304033
3194	100	2	2	55	3	2026-08-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.331179	2026-09-10 16:45:35.331179
3196	100	3	1	37	3	2026-08-06	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:35.356814	2026-09-10 16:45:35.356814
3198	100	4	1	79	3	2026-08-05	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:35.394099	2026-09-10 16:45:35.394099
2605	100	5	1	44	1	2026-08-04	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.330389	2026-09-10 16:44:37.330389
2606	100	6	1	53	1	2026-08-03	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.334634	2026-09-10 16:44:37.334634
2607	100	7	2	101	1	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.341943	2026-09-10 16:44:37.341943
2608	100	8	2	35	1	2026-08-01	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.345758	2026-09-10 16:44:37.345758
2609	100	9	1	37	2	2026-07-31	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.350449	2026-09-10 16:44:37.350449
2610	100	10	2	29	1	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.356734	2026-09-10 16:44:37.356734
2611	100	11	3	24	2	2026-07-29	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.362023	2026-09-10 16:44:37.362023
2612	100	12	3	24	1	2026-07-28	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.365686	2026-09-10 16:44:37.365686
2613	100	13	5	17	2	2026-07-27	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.371262	2026-09-10 16:44:37.371262
2614	100	14	2	29	1	2026-07-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.375963	2026-09-10 16:44:37.375963
2615	100	15	2	29	1	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.379957	2026-09-10 16:44:37.379957
2616	100	16	3	24	2	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.385343	2026-09-10 16:44:37.385343
2617	100	17	5	17	2	2026-07-23	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.391051	2026-09-10 16:44:37.391051
2618	100	18	5	17	2	2026-07-22	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.396684	2026-09-10 16:44:37.396684
3200	101	1	4	24	4	2026-08-07	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:35.426897	2026-09-10 16:45:35.426897
3202	101	2	4	38	4	2026-08-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:35.460931	2026-09-10 16:45:35.460931
3204	101	3	2	29	4	2026-08-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.487996	2026-09-10 16:45:35.487996
3206	101	4	5	37	4	2026-08-04	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:35.521033	2026-09-10 16:45:35.521033
2623	101	5	5	21	2	2026-08-03	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.425097	2026-09-10 16:44:37.425097
2624	101	6	4	29	2	2026-08-02	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.428999	2026-09-10 16:44:37.428999
2625	101	7	3	84	2	2026-08-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.434481	2026-09-10 16:44:37.434481
2626	101	8	2	35	2	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.441935	2026-09-10 16:44:37.441935
2627	101	9	2	29	2	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.44553	2026-09-10 16:44:37.44553
2628	101	10	3	24	1	2026-07-29	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.450226	2026-09-10 16:44:37.450226
2629	101	11	3	24	1	2026-07-28	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.456396	2026-09-10 16:44:37.456396
2630	101	12	2	29	1	2026-07-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.460809	2026-09-10 16:44:37.460809
2631	101	13	1	37	1	2026-07-26	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.464372	2026-09-10 16:44:37.464372
2632	101	14	1	37	1	2026-07-25	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.47031	2026-09-10 16:44:37.47031
2633	101	15	3	24	1	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.475159	2026-09-10 16:44:37.475159
2634	101	16	2	29	1	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.480152	2026-09-10 16:44:37.480152
2635	101	17	2	29	1	2026-07-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.48316	2026-09-10 16:44:37.48316
2636	101	18	1	37	1	2026-07-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.489456	2026-09-10 16:44:37.489456
3208	102	1	1	42	3	2026-08-06	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:35.549994	2026-09-10 16:45:35.549994
3210	102	2	2	55	3	2026-08-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.580167	2026-09-10 16:45:35.580167
3212	102	3	2	29	3	2026-08-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.61917	2026-09-10 16:45:35.61917
3214	102	4	1	79	3	2026-08-03	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:35.65647	2026-09-10 16:45:35.65647
2641	102	5	1	44	1	2026-08-02	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.515472	2026-09-10 16:44:37.515472
2642	102	6	1	53	1	2026-08-01	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.523137	2026-09-10 16:44:37.523137
2643	102	7	2	101	1	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.526908	2026-09-10 16:44:37.526908
2644	102	8	2	35	1	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.53091	2026-09-10 16:44:37.53091
2645	102	9	1	37	2	2026-07-29	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.535899	2026-09-10 16:44:37.535899
2646	102	10	2	29	1	2026-07-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.542012	2026-09-10 16:44:37.542012
2647	102	11	3	24	2	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.546647	2026-09-10 16:44:37.546647
2648	102	12	3	24	1	2026-07-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.550311	2026-09-10 16:44:37.550311
2649	102	13	5	17	2	2026-07-25	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.556962	2026-09-10 16:44:37.556962
2650	102	14	3	24	1	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.561204	2026-09-10 16:44:37.561204
2651	102	15	2	29	1	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.565832	2026-09-10 16:44:37.565832
2652	102	16	3	24	2	2026-07-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.571831	2026-09-10 16:44:37.571831
2653	102	17	3	24	2	2026-07-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.577223	2026-09-10 16:44:37.577223
2654	102	18	5	17	2	2026-07-20	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.580438	2026-09-10 16:44:37.580438
3216	103	1	3	28	4	2026-08-05	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.689688	2026-09-10 16:45:35.689688
3218	103	2	3	45	4	2026-08-04	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.723187	2026-09-10 16:45:35.723187
3220	103	3	2	29	4	2026-08-03	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.755434	2026-09-10 16:45:35.755434
3222	103	4	2	63	4	2026-08-02	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.797	2026-09-10 16:45:35.797
2659	103	5	4	25	2	2026-08-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.606694	2026-09-10 16:44:37.606694
2660	103	6	3	35	2	2026-07-31	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.610246	2026-09-10 16:44:37.610246
2661	103	7	4	71	2	2026-07-30	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.614767	2026-09-10 16:44:37.614767
2662	103	8	4	25	2	2026-07-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.620296	2026-09-10 16:44:37.620296
2663	103	9	2	29	2	2026-07-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.625182	2026-09-10 16:44:37.625182
2664	103	10	3	24	1	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.629554	2026-09-10 16:44:37.629554
2665	103	11	3	24	1	2026-07-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.63332	2026-09-10 16:44:37.63332
2666	103	12	2	29	1	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.639075	2026-09-10 16:44:37.639075
2667	103	13	2	29	1	2026-07-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.643056	2026-09-10 16:44:37.643056
2668	103	14	1	37	1	2026-07-23	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.646649	2026-09-10 16:44:37.646649
2669	103	15	3	24	1	2026-07-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.650363	2026-09-10 16:44:37.650363
2670	103	16	3	24	1	2026-07-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.656731	2026-09-10 16:44:37.656731
2671	103	17	2	29	1	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.660503	2026-09-10 16:44:37.660503
2672	103	18	2	29	1	2026-07-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.664295	2026-09-10 16:44:37.664295
3224	104	1	2	34	3	2026-08-04	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.837132	2026-09-10 16:45:35.837132
3226	104	2	2	55	3	2026-08-03	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:35.873095	2026-09-10 16:45:35.873095
3228	104	3	3	24	3	2026-08-02	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.92233	2026-09-10 16:45:35.92233
3230	104	4	3	52	3	2026-08-01	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:35.969309	2026-09-10 16:45:35.969309
2677	104	5	2	35	1	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.685622	2026-09-10 16:44:37.685622
2678	104	6	2	42	1	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.690356	2026-09-10 16:44:37.690356
2679	104	7	2	101	1	2026-07-29	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.694653	2026-09-10 16:44:37.694653
2680	104	8	3	29	1	2026-07-28	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.698352	2026-09-10 16:44:37.698352
2681	104	9	3	24	1	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.704154	2026-09-10 16:44:37.704154
2682	104	10	5	17	2	2026-07-26	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.708859	2026-09-10 16:44:37.708859
2683	104	11	3	24	1	2026-07-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.71285	2026-09-10 16:44:37.71285
2684	104	12	4	21	2	2026-07-24	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.71655	2026-09-10 16:44:37.71655
2685	104	13	4	21	1	2026-07-23	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.722976	2026-09-10 16:44:37.722976
2686	104	14	5	17	2	2026-07-22	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.726684	2026-09-10 16:44:37.726684
2687	104	15	5	17	2	2026-07-21	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.731985	2026-09-10 16:44:37.731985
2688	104	16	3	24	1	2026-07-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.734714	2026-09-10 16:44:37.734714
2689	104	17	2	29	1	2026-07-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.741929	2026-09-10 16:44:37.741929
2690	104	18	4	21	1	2026-07-18	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.745751	2026-09-10 16:44:37.745751
3232	105	1	4	24	4	2026-08-03	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:36.011956	2026-09-10 16:45:36.011956
3234	105	2	3	45	4	2026-08-02	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:36.055868	2026-09-10 16:45:36.055868
3236	105	3	4	21	4	2026-08-01	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:36.08662	2026-09-10 16:45:36.08662
3238	105	4	2	63	4	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.150282	2026-09-10 16:45:36.150282
2695	105	5	2	35	2	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.772322	2026-09-10 16:44:37.772322
2696	105	6	4	29	2	2026-07-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.777941	2026-09-10 16:44:37.777941
2697	105	7	3	84	2	2026-07-28	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.782022	2026-09-10 16:44:37.782022
2698	105	8	3	29	2	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.786601	2026-09-10 16:44:37.786601
2699	105	9	3	24	2	2026-07-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.791905	2026-09-10 16:44:37.791905
2700	105	10	2	29	1	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.795667	2026-09-10 16:44:37.795667
2701	105	11	3	24	1	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.800232	2026-09-10 16:44:37.800232
2702	105	12	3	24	1	2026-07-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.805787	2026-09-10 16:44:37.805787
2703	105	13	2	29	1	2026-07-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.810296	2026-09-10 16:44:37.810296
2704	105	14	1	37	1	2026-07-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.814013	2026-09-10 16:44:37.814013
2705	105	15	1	37	1	2026-07-20	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.818262	2026-09-10 16:44:37.818262
2706	105	16	3	24	1	2026-07-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.82394	2026-09-10 16:44:37.82394
2707	105	17	3	24	1	2026-07-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.826644	2026-09-10 16:44:37.826644
2708	105	18	2	29	1	2026-07-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.830345	2026-09-10 16:44:37.830345
3242	106	2	1	68	3	2026-08-01	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.224757	2026-09-10 16:45:36.224757
3244	106	3	2	29	3	2026-07-31	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.261959	2026-09-10 16:45:36.261959
3246	106	4	2	63	3	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.292064	2026-09-10 16:45:36.292064
2713	106	5	1	44	1	2026-07-29	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.854816	2026-09-10 16:44:37.854816
2714	106	6	1	53	1	2026-07-28	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.857854	2026-09-10 16:44:37.857854
2715	106	7	1	126	1	2026-07-27	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.863161	2026-09-10 16:44:37.863161
2716	106	8	2	35	1	2026-07-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.866788	2026-09-10 16:44:37.866788
2717	106	9	2	29	2	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.872336	2026-09-10 16:44:37.872336
2718	106	10	3	24	1	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.877022	2026-09-10 16:44:37.877022
2719	106	11	4	21	2	2026-07-23	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.881027	2026-09-10 16:44:37.881027
2720	106	12	2	29	1	2026-07-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.885065	2026-09-10 16:44:37.885065
2721	106	13	3	24	2	2026-07-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.891131	2026-09-10 16:44:37.891131
2722	106	14	3	24	1	2026-07-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.894692	2026-09-10 16:44:37.894692
2723	106	15	3	24	1	2026-07-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.898805	2026-09-10 16:44:37.898805
2724	106	16	4	21	2	2026-07-18	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.904969	2026-09-10 16:44:37.904969
2725	106	17	4	21	2	2026-07-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:37.908978	2026-09-10 16:44:37.908978
2726	106	18	3	24	2	2026-07-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.913057	2026-09-10 16:44:37.913057
3248	107	1	5	20	4	2026-08-01	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:36.325383	2026-09-10 16:45:36.325383
3250	107	2	5	32	4	2026-07-31	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:36.361399	2026-09-10 16:45:36.361399
3252	107	3	3	24	4	2026-07-30	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:36.393197	2026-09-10 16:45:36.393197
3254	107	4	4	44	4	2026-07-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:36.432167	2026-09-10 16:45:36.432167
2731	107	5	3	29	2	2026-07-28	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.940198	2026-09-10 16:44:37.940198
2732	107	6	5	25	2	2026-07-27	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:37.943816	2026-09-10 16:44:37.943816
2733	107	7	3	84	2	2026-07-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.948921	2026-09-10 16:44:37.948921
2734	107	8	3	29	2	2026-07-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.954535	2026-09-10 16:44:37.954535
2735	107	9	3	24	2	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.960414	2026-09-10 16:44:37.960414
2736	107	10	2	29	1	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.964573	2026-09-10 16:44:37.964573
2737	107	11	3	24	1	2026-07-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.970312	2026-09-10 16:44:37.970312
2738	107	12	3	24	1	2026-07-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:37.975741	2026-09-10 16:44:37.975741
2739	107	13	2	29	1	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.980367	2026-09-10 16:44:37.980367
2740	107	14	2	29	1	2026-07-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:37.984674	2026-09-10 16:44:37.984674
2741	107	15	1	37	1	2026-07-18	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.992103	2026-09-10 16:44:37.992103
2742	107	16	1	37	1	2026-07-17	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:37.998867	2026-09-10 16:44:37.998867
2743	107	17	3	24	1	2026-07-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.005471	2026-09-10 16:44:38.005471
2744	107	18	2	29	1	2026-07-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.009173	2026-09-10 16:44:38.009173
3256	108	1	1	42	3	2026-07-31	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.470031	2026-09-10 16:45:36.470031
3258	108	2	1	68	3	2026-07-30	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.503228	2026-09-10 16:45:36.503228
3260	108	3	1	37	3	2026-07-29	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.539498	2026-09-10 16:45:36.539498
3262	108	4	2	63	3	2026-07-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.583198	2026-09-10 16:45:36.583198
2749	108	5	2	35	1	2026-07-27	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.03929	2026-09-10 16:44:38.03929
2750	108	6	1	53	1	2026-07-26	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.04298	2026-09-10 16:44:38.04298
2751	108	7	1	126	1	2026-07-25	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.046517	2026-09-10 16:44:38.046517
2752	108	8	1	44	1	2026-07-24	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.051228	2026-09-10 16:44:38.051228
2753	108	9	2	29	2	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.058176	2026-09-10 16:44:38.058176
2754	108	10	3	24	1	2026-07-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.062371	2026-09-10 16:44:38.062371
2755	108	11	4	21	2	2026-07-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.066048	2026-09-10 16:44:38.066048
2756	108	12	2	29	1	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.070954	2026-09-10 16:44:38.070954
2757	108	13	3	24	2	2026-07-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.082986	2026-09-10 16:44:38.082986
2758	108	14	3	24	1	2026-07-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.088102	2026-09-10 16:44:38.088102
2759	108	15	3	24	1	2026-07-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.092208	2026-09-10 16:44:38.092208
2760	108	16	4	21	2	2026-07-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.095915	2026-09-10 16:44:38.095915
2761	108	17	4	21	2	2026-07-15	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.099901	2026-09-10 16:44:38.099901
2762	108	18	3	24	2	2026-07-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.105609	2026-09-10 16:44:38.105609
3264	109	1	2	34	4	2026-07-30	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.622344	2026-09-10 16:45:36.622344
3266	109	2	4	38	4	2026-07-29	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:36.662852	2026-09-10 16:45:36.662852
3268	109	3	3	24	4	2026-07-28	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:36.693124	2026-09-10 16:45:36.693124
3270	109	4	3	52	4	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:36.724391	2026-09-10 16:45:36.724391
2767	109	5	2	35	2	2026-07-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.131889	2026-09-10 16:44:38.131889
2768	109	6	2	42	2	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.136567	2026-09-10 16:44:38.136567
2769	109	7	5	59	2	2026-07-24	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.142147	2026-09-10 16:44:38.142147
2770	109	8	5	21	2	2026-07-23	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.147844	2026-09-10 16:44:38.147844
2771	109	9	3	24	2	2026-07-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.154955	2026-09-10 16:44:38.154955
2772	109	10	2	29	1	2026-07-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.159498	2026-09-10 16:44:38.159498
2773	109	11	2	29	1	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.163955	2026-09-10 16:44:38.163955
2774	109	12	3	24	1	2026-07-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.168977	2026-09-10 16:44:38.168977
2775	109	13	3	24	1	2026-07-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.175439	2026-09-10 16:44:38.175439
2776	109	14	2	29	1	2026-07-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.179026	2026-09-10 16:44:38.179026
2777	109	15	2	29	1	2026-07-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.184024	2026-09-10 16:44:38.184024
2778	109	16	1	37	1	2026-07-15	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.190284	2026-09-10 16:44:38.190284
2779	109	17	3	24	1	2026-07-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.194398	2026-09-10 16:44:38.194398
2780	109	18	3	24	1	2026-07-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.198981	2026-09-10 16:44:38.198981
3272	110	1	1	42	3	2026-07-29	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.754916	2026-09-10 16:45:36.754916
3274	110	2	1	68	3	2026-07-28	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.785929	2026-09-10 16:45:36.785929
3276	110	3	1	37	3	2026-07-27	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:36.817222	2026-09-10 16:45:36.817222
3278	110	4	2	63	3	2026-07-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.849429	2026-09-10 16:45:36.849429
2785	110	5	2	35	1	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.225324	2026-09-10 16:44:38.225324
2786	110	6	2	42	1	2026-07-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.228854	2026-09-10 16:44:38.228854
2787	110	7	1	126	1	2026-07-23	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.233909	2026-09-10 16:44:38.233909
2788	110	8	1	44	1	2026-07-22	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.240067	2026-09-10 16:44:38.240067
2789	110	9	1	37	2	2026-07-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.245194	2026-09-10 16:44:38.245194
2790	110	10	3	24	1	2026-07-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.249288	2026-09-10 16:44:38.249288
2791	110	11	5	17	2	2026-07-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.256878	2026-09-10 16:44:38.256878
2792	110	12	2	29	1	2026-07-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.260587	2026-09-10 16:44:38.260587
2793	110	13	4	21	2	2026-07-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.2649	2026-09-10 16:44:38.2649
2794	110	14	2	29	1	2026-07-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.268817	2026-09-10 16:44:38.268817
2795	110	15	3	24	1	2026-07-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.274502	2026-09-10 16:44:38.274502
2796	110	16	5	17	2	2026-07-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.279254	2026-09-10 16:44:38.279254
2797	110	17	4	21	2	2026-07-13	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.282964	2026-09-10 16:44:38.282964
2798	110	18	4	21	2	2026-09-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.290289	2026-09-10 16:44:38.290289
3280	111	1	2	34	4	2026-07-28	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:36.875164	2026-09-10 16:45:36.875164
3282	111	2	4	38	4	2026-07-27	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:36.905943	2026-09-10 16:45:36.905943
3284	111	3	5	17	4	2026-07-26	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:36.935787	2026-09-10 16:45:36.935787
3286	111	4	3	52	4	2026-07-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:36.959128	2026-09-10 16:45:36.959128
2803	111	5	3	29	2	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.314531	2026-09-10 16:44:38.314531
2804	111	6	2	42	2	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.318221	2026-09-10 16:44:38.318221
2805	111	7	4	71	2	2026-07-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.32456	2026-09-10 16:44:38.32456
2806	111	8	4	25	2	2026-07-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.328264	2026-09-10 16:44:38.328264
2807	111	9	4	21	2	2026-07-20	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.331956	2026-09-10 16:44:38.331956
2808	111	10	2	29	1	2026-07-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.339036	2026-09-10 16:44:38.339036
2809	111	11	2	29	1	2026-07-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.342989	2026-09-10 16:44:38.342989
2810	111	12	2	29	1	2026-07-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.34675	2026-09-10 16:44:38.34675
2811	111	13	3	24	1	2026-07-16	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.350364	2026-09-10 16:44:38.350364
2812	111	14	2	29	1	2026-07-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.35729	2026-09-10 16:44:38.35729
2813	111	15	2	29	1	2026-07-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.360983	2026-09-10 16:44:38.360983
2814	111	16	1	37	1	2026-07-13	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.364501	2026-09-10 16:44:38.364501
2815	111	17	1	37	1	2026-09-10	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.370298	2026-09-10 16:44:38.370298
2816	111	18	3	24	1	2026-09-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.375601	2026-09-10 16:44:38.375601
3288	112	1	3	28	3	2026-07-27	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:36.98921	2026-09-10 16:45:36.98921
3290	112	2	2	55	3	2026-07-26	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.023163	2026-09-10 16:45:37.023163
3292	112	3	2	29	3	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.059979	2026-09-10 16:45:37.059979
3294	112	4	2	63	3	2026-07-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.098006	2026-09-10 16:45:37.098006
2821	112	5	3	29	1	2026-07-23	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.398098	2026-09-10 16:44:38.398098
2822	112	6	3	35	1	2026-07-22	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.403135	2026-09-10 16:44:38.403135
2823	112	7	3	84	1	2026-07-21	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.407846	2026-09-10 16:44:38.407846
2824	112	8	2	35	1	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.41176	2026-09-10 16:44:38.41176
2825	112	9	2	29	1	2026-07-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.415379	2026-09-10 16:44:38.415379
2826	112	10	5	17	2	2026-07-18	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.422006	2026-09-10 16:44:38.422006
2827	112	11	4	21	1	2026-07-17	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.4268	2026-09-10 16:44:38.4268
2828	112	12	5	17	2	2026-07-16	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.430741	2026-09-10 16:44:38.430741
2829	112	13	3	24	1	2026-07-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.435034	2026-09-10 16:44:38.435034
2830	112	14	4	21	2	2026-07-14	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.44203	2026-09-10 16:44:38.44203
2831	112	15	4	21	2	2026-07-13	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.446231	2026-09-10 16:44:38.446231
2832	112	16	4	21	1	2026-09-10	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.449219	2026-09-10 16:44:38.449219
2833	112	17	4	21	1	2026-09-09	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.454226	2026-09-10 16:44:38.454226
2834	112	18	3	24	1	2026-09-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.459434	2026-09-10 16:44:38.459434
3296	113	1	3	28	4	2026-07-26	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:37.127933	2026-09-10 16:45:37.127933
3298	113	2	3	45	4	2026-07-25	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:37.159016	2026-09-10 16:45:37.159016
3300	113	3	4	21	4	2026-07-24	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:37.189913	2026-09-10 16:45:37.189913
3302	113	4	5	37	4	2026-07-23	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:37.228243	2026-09-10 16:45:37.228243
2839	113	5	4	25	2	2026-07-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.483014	2026-09-10 16:44:38.483014
2840	113	6	4	29	2	2026-07-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.489156	2026-09-10 16:44:38.489156
2841	113	7	2	101	2	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.495362	2026-09-10 16:44:38.495362
2842	113	8	4	25	2	2026-07-19	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.498939	2026-09-10 16:44:38.498939
2843	113	9	3	24	2	2026-07-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.505592	2026-09-10 16:44:38.505592
2844	113	10	2	29	1	2026-07-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.510099	2026-09-10 16:44:38.510099
2845	113	11	2	29	1	2026-07-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.514132	2026-09-10 16:44:38.514132
2846	113	12	2	29	1	2026-07-15	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.51667	2026-09-10 16:44:38.51667
2847	113	13	3	24	1	2026-07-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.524762	2026-09-10 16:44:38.524762
2848	113	14	3	24	1	2026-07-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.527762	2026-09-10 16:44:38.527762
2849	113	15	2	29	1	2026-09-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.531756	2026-09-10 16:44:38.531756
2850	113	16	2	29	1	2026-09-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.537936	2026-09-10 16:44:38.537936
2851	113	17	1	37	1	2026-09-08	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.542816	2026-09-10 16:44:38.542816
2852	113	18	1	37	1	2026-09-07	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.546355	2026-09-10 16:44:38.546355
3304	114	1	2	34	3	2026-07-25	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.266673	2026-09-10 16:45:37.266673
3306	114	2	2	55	3	2026-07-24	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.305558	2026-09-10 16:45:37.305558
3308	114	3	1	37	3	2026-07-23	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:37.335956	2026-09-10 16:45:37.335956
3310	114	4	1	79	3	2026-07-22	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:37.368033	2026-09-10 16:45:37.368033
2857	114	5	1	44	1	2026-07-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.572236	2026-09-10 16:44:38.572236
2858	114	6	2	42	1	2026-07-20	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.576851	2026-09-10 16:44:38.576851
2859	114	7	2	101	1	2026-07-19	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.580941	2026-09-10 16:44:38.580941
2860	114	8	1	44	1	2026-07-18	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.585434	2026-09-10 16:44:38.585434
2861	114	9	1	37	2	2026-07-17	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.590431	2026-09-10 16:44:38.590431
2862	114	10	2	29	1	2026-07-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.595721	2026-09-10 16:44:38.595721
2863	114	11	5	17	2	2026-07-15	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.600029	2026-09-10 16:44:38.600029
2864	114	12	3	24	1	2026-07-14	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.605725	2026-09-10 16:44:38.605725
2865	114	13	4	21	2	2026-07-13	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.609382	2026-09-10 16:44:38.609382
2866	114	14	2	29	1	2026-09-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.613992	2026-09-10 16:44:38.613992
2867	114	15	2	29	1	2026-09-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.618317	2026-09-10 16:44:38.618317
2868	114	16	5	17	2	2026-09-08	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.624124	2026-09-10 16:44:38.624124
2869	114	17	5	17	2	2026-09-07	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.628406	2026-09-10 16:44:38.628406
2870	114	18	4	21	2	2026-09-06	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.632051	2026-09-10 16:44:38.632051
3312	115	1	3	28	4	2026-07-24	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:37.405041	2026-09-10 16:45:37.405041
3314	115	2	2	55	4	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.444234	2026-09-10 16:45:37.444234
3316	115	3	4	21	4	2026-07-22	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:37.488329	2026-09-10 16:45:37.488329
3318	115	4	4	44	4	2026-07-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:37.524178	2026-09-10 16:45:37.524178
2875	115	5	3	29	2	2026-07-20	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.65829	2026-09-10 16:44:38.65829
2876	115	6	3	35	2	2026-07-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.662989	2026-09-10 16:44:38.662989
2877	115	7	3	84	2	2026-07-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.666541	2026-09-10 16:44:38.666541
2878	115	8	3	29	2	2026-07-17	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.67348	2026-09-10 16:44:38.67348
2879	115	9	4	21	2	2026-07-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.678118	2026-09-10 16:44:38.678118
2880	115	10	3	24	1	2026-07-15	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.682119	2026-09-10 16:44:38.682119
2881	115	11	2	29	1	2026-07-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.686752	2026-09-10 16:44:38.686752
2882	115	12	2	29	1	2026-07-13	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.692907	2026-09-10 16:44:38.692907
2883	115	13	1	37	1	2026-09-10	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.696437	2026-09-10 16:44:38.696437
2884	115	14	3	24	1	2026-09-09	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.700417	2026-09-10 16:44:38.700417
2885	115	15	3	24	1	2026-09-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.70647	2026-09-10 16:44:38.70647
2886	115	16	2	29	1	2026-09-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.711003	2026-09-10 16:44:38.711003
2887	115	17	2	29	1	2026-09-06	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.714581	2026-09-10 16:44:38.714581
2888	115	18	1	37	1	2026-09-05	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.720052	2026-09-10 16:44:38.720052
3320	116	1	2	34	3	2026-07-23	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.563986	2026-09-10 16:45:37.563986
3322	116	2	2	55	3	2026-07-22	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.600355	2026-09-10 16:45:37.600355
3324	116	3	1	37	3	2026-07-21	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:37.633183	2026-09-10 16:45:37.633183
3326	116	4	1	79	3	2026-07-20	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:45:37.669061	2026-09-10 16:45:37.669061
2893	116	5	1	44	1	2026-07-19	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.743942	2026-09-10 16:44:38.743942
2894	116	6	2	42	1	2026-07-18	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.746652	2026-09-10 16:44:38.746652
2895	116	7	2	101	1	2026-07-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.750365	2026-09-10 16:44:38.750365
2896	116	8	1	44	1	2026-07-16	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.758227	2026-09-10 16:44:38.758227
2897	116	9	1	37	2	2026-07-15	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.762942	2026-09-10 16:44:38.762942
2898	116	10	2	29	1	2026-07-14	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.765638	2026-09-10 16:44:38.765638
2899	116	11	3	24	2	2026-07-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.771957	2026-09-10 16:44:38.771957
2900	116	12	3	24	1	2026-09-10	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.777307	2026-09-10 16:44:38.777307
2901	116	13	5	17	2	2026-09-09	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.781844	2026-09-10 16:44:38.781844
2902	116	14	2	29	1	2026-09-08	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.78654	2026-09-10 16:44:38.78654
2903	116	15	2	29	1	2026-09-07	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.792258	2026-09-10 16:44:38.792258
2904	116	16	3	24	2	2026-09-06	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.79597	2026-09-10 16:44:38.79597
2905	116	17	5	17	2	2026-09-05	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.800424	2026-09-10 16:44:38.800424
2906	116	18	5	17	2	2026-09-04	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.806367	2026-09-10 16:44:38.806367
3328	117	1	5	20	3	2026-07-22	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:37.70419	2026-09-10 16:45:37.70419
3330	117	2	4	38	3	2026-07-21	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:37.741113	2026-09-10 16:45:37.741113
3332	117	3	4	21	3	2026-07-20	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:37.779114	2026-09-10 16:45:37.779114
3334	117	4	5	37	3	2026-07-19	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:45:37.820192	2026-09-10 16:45:37.820192
2911	117	5	5	21	1	2026-07-18	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.83041	2026-09-10 16:44:38.83041
2912	117	6	5	25	1	2026-07-17	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.834508	2026-09-10 16:44:38.834508
2913	117	7	4	71	1	2026-07-16	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.841033	2026-09-10 16:44:38.841033
2914	117	8	4	25	1	2026-07-15	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.845139	2026-09-10 16:44:38.845139
2915	117	9	5	17	1	2026-07-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.849275	2026-09-10 16:44:38.849275
2916	117	10	5	17	2	2026-07-13	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.855611	2026-09-10 16:44:38.855611
2917	117	11	5	17	1	2026-09-10	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.859849	2026-09-10 16:44:38.859849
2918	117	12	4	21	2	2026-09-09	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.865669	2026-09-10 16:44:38.865669
2919	117	13	4	21	1	2026-09-08	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.870268	2026-09-10 16:44:38.870268
2920	117	14	4	21	2	2026-09-07	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.876938	2026-09-10 16:44:38.876938
2921	117	15	5	17	2	2026-09-06	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.880937	2026-09-10 16:44:38.880937
2922	117	16	5	17	1	2026-09-05	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.884547	2026-09-10 16:44:38.884547
2923	117	17	5	17	1	2026-09-04	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.890232	2026-09-10 16:44:38.890232
2924	117	18	4	21	1	2026-09-03	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:44:38.893826	2026-09-10 16:44:38.893826
3336	118	1	2	34	4	2026-07-21	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:45:37.858253	2026-09-10 16:45:37.858253
3338	118	2	4	38	4	2026-07-20	t	Grade A Certified — Consistently meets 100% standard SAM	2026-09-10 16:45:37.896442	2026-09-10 16:45:37.896442
3340	118	3	3	24	4	2026-07-19	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:37.942407	2026-09-10 16:45:37.942407
3342	118	4	3	52	4	2026-07-18	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:45:37.982127	2026-09-10 16:45:37.982127
2929	118	5	2	35	2	2026-07-17	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.923911	2026-09-10 16:44:38.923911
2930	118	6	2	42	2	2026-07-16	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.928208	2026-09-10 16:44:38.928208
2931	118	7	5	59	2	2026-07-15	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.931851	2026-09-10 16:44:38.931851
2932	118	8	5	21	2	2026-07-14	t	Grade A+ Certified — Master technician pace, zero-defect standard	2026-09-10 16:44:38.93736	2026-09-10 16:44:38.93736
2933	118	9	3	24	2	2026-07-13	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.94429	2026-09-10 16:44:38.94429
2934	118	10	2	29	1	2026-09-10	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.946986	2026-09-10 16:44:38.946986
2935	118	11	2	29	1	2026-09-09	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.951475	2026-09-10 16:44:38.951475
2936	118	12	3	24	1	2026-09-08	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.958	2026-09-10 16:44:38.958
2937	118	13	3	24	1	2026-09-07	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.962437	2026-09-10 16:44:38.962437
2938	118	14	2	29	1	2026-09-06	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.966066	2026-09-10 16:44:38.966066
2939	118	15	2	29	1	2026-09-05	t	Grade C — Developing cross-training; supervised practice	2026-09-10 16:44:38.971868	2026-09-10 16:44:38.971868
2940	118	16	1	37	1	2026-09-04	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.975621	2026-09-10 16:44:38.975621
2941	118	17	1	37	1	2026-09-03	t	Trainee Level — Basic machine setup & orientation	2026-09-10 16:44:38.982214	2026-09-10 16:44:38.982214
2942	118	18	3	24	1	2026-09-02	t	Grade B Certified — Qualified standard production pace	2026-09-10 16:44:38.987139	2026-09-10 16:44:38.987139
\.


--
-- Data for Name: skill_matrix_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_matrix_history (id, operator_id, operation_id, old_rating, new_rating, updated_by, updated_at) FROM stdin;
25	69	2	5	4	Manager	2026-09-10 16:44:32.873207
26	69	4	4	3	Manager	2026-09-10 16:44:32.902076
27	69	5	5	4	Manager	2026-09-10 16:44:32.91816
28	69	6	3	4	Manager	2026-09-10 16:44:32.931208
29	69	8	5	3	Manager	2026-09-10 16:44:32.955708
30	69	9	3	4	Manager	2026-09-10 16:44:32.96702
31	69	10	0	3	Manager	2026-09-10 16:44:32.979115
32	69	11	0	2	Manager	2026-09-10 16:44:32.987241
33	69	12	0	3	Manager	2026-09-10 16:44:32.998266
34	69	13	0	3	Manager	2026-09-10 16:44:33.008851
35	69	14	0	2	Manager	2026-09-10 16:44:33.016922
36	69	15	0	3	Manager	2026-09-10 16:44:33.026909
37	69	16	0	3	Manager	2026-09-10 16:44:33.037978
38	69	17	0	2	Manager	2026-09-10 16:44:33.046714
39	69	18	0	2	Manager	2026-09-10 16:44:33.056668
40	70	1	5	3	Manager	2026-09-10 16:44:33.079004
41	70	2	3	4	Manager	2026-09-10 16:44:33.090981
42	70	4	5	3	Manager	2026-09-10 16:44:33.111834
43	70	5	3	4	Manager	2026-09-10 16:44:33.121899
44	70	8	3	5	Manager	2026-09-10 16:44:33.150122
45	70	9	4	3	Manager	2026-09-10 16:44:33.160159
46	70	10	0	3	Manager	2026-09-10 16:44:33.166672
47	70	11	0	2	Manager	2026-09-10 16:44:33.178107
48	70	12	0	2	Manager	2026-09-10 16:44:33.18562
49	70	13	0	3	Manager	2026-09-10 16:44:33.19549
50	70	14	0	3	Manager	2026-09-10 16:44:33.205525
51	70	15	0	2	Manager	2026-09-10 16:44:33.212947
52	70	16	0	2	Manager	2026-09-10 16:44:33.221954
53	70	17	0	3	Manager	2026-09-10 16:44:33.230006
54	70	18	0	2	Manager	2026-09-10 16:44:33.24117
55	71	3	5	2	Manager	2026-09-10 16:44:33.272252
56	71	4	3	4	Manager	2026-09-10 16:44:33.284021
57	71	6	5	4	Manager	2026-09-10 16:44:33.305307
58	71	8	4	3	Manager	2026-09-10 16:44:33.32907
59	71	9	5	3	Manager	2026-09-10 16:44:33.339108
60	71	10	0	3	Manager	2026-09-10 16:44:33.347187
61	71	11	0	3	Manager	2026-09-10 16:44:33.359916
62	71	12	0	3	Manager	2026-09-10 16:44:33.367752
63	71	13	0	3	Manager	2026-09-10 16:44:33.378864
64	71	14	0	2	Manager	2026-09-10 16:44:33.387922
65	71	15	0	2	Manager	2026-09-10 16:44:33.398235
66	71	16	0	3	Manager	2026-09-10 16:44:33.408152
67	71	17	0	2	Manager	2026-09-10 16:44:33.415904
68	71	18	0	2	Manager	2026-09-10 16:44:33.430651
69	72	1	4	3	Manager	2026-09-10 16:44:33.455831
70	72	2	5	4	Manager	2026-09-10 16:44:33.474493
71	72	5	5	4	Manager	2026-09-10 16:44:33.550894
72	72	6	3	4	Manager	2026-09-10 16:44:33.57663
73	72	8	5	4	Manager	2026-09-10 16:44:33.644134
74	72	10	3	2	Manager	2026-09-10 16:44:33.683752
75	72	13	0	3	Manager	2026-09-10 16:44:33.74537
76	72	14	0	2	Manager	2026-09-10 16:44:33.763025
77	72	15	0	3	Manager	2026-09-10 16:44:33.782794
78	72	16	0	3	Manager	2026-09-10 16:44:33.803813
79	72	17	0	3	Manager	2026-09-10 16:44:33.820243
80	72	18	0	2	Manager	2026-09-10 16:44:33.83804
81	73	1	5	4	Manager	2026-09-10 16:44:33.862255
82	73	2	3	4	Manager	2026-09-10 16:44:33.882226
83	73	3	4	3	Manager	2026-09-10 16:44:33.900923
84	73	4	5	4	Manager	2026-09-10 16:44:33.920414
85	73	5	3	4	Manager	2026-09-10 16:44:33.936777
86	73	8	3	5	Manager	2026-09-10 16:44:33.986879
87	73	9	4	3	Manager	2026-09-10 16:44:34.000938
88	73	10	0	2	Manager	2026-09-10 16:44:34.016581
89	73	11	0	3	Manager	2026-09-10 16:44:34.031196
90	73	12	0	2	Manager	2026-09-10 16:44:34.045537
91	73	13	0	2	Manager	2026-09-10 16:44:34.060391
92	73	14	0	3	Manager	2026-09-10 16:44:34.07563
93	73	15	0	2	Manager	2026-09-10 16:44:34.085629
94	73	16	0	3	Manager	2026-09-10 16:44:34.098151
95	73	17	0	2	Manager	2026-09-10 16:44:34.110322
96	73	18	0	2	Manager	2026-09-10 16:44:34.118964
97	74	4	4	5	Manager	2026-09-10 16:44:34.177947
98	74	8	4	5	Manager	2026-09-10 16:44:34.229453
99	74	9	5	4	Manager	2026-09-10 16:44:34.256983
100	74	10	0	4	Manager	2026-09-10 16:44:34.266439
101	74	11	0	3	Manager	2026-09-10 16:44:34.28306
102	74	12	0	5	Manager	2026-09-10 16:44:34.30025
103	74	13	0	3	Manager	2026-09-10 16:44:34.319898
104	74	14	0	5	Manager	2026-09-10 16:44:34.333881
105	74	15	0	5	Manager	2026-09-10 16:44:34.348271
107	74	17	0	3	Manager	2026-09-10 16:44:34.378023
108	74	18	0	4	Manager	2026-09-10 16:44:34.385136
110	75	2	5	2	Manager	2026-09-10 16:44:34.402365
111	75	3	3	5	Manager	2026-09-10 16:44:34.410053
113	75	5	5	3	Manager	2026-09-10 16:44:34.429275
114	75	7	4	2	Manager	2026-09-10 16:44:34.446675
116	75	9	3	5	Manager	2026-09-10 16:44:34.46495
117	75	10	0	2	Manager	2026-09-10 16:44:34.474491
119	75	12	0	2	Manager	2026-09-10 16:44:34.490991
120	75	13	0	3	Manager	2026-09-10 16:44:34.496671
122	75	15	0	2	Manager	2026-09-10 16:44:34.512398
123	75	16	0	2	Manager	2026-09-10 16:44:34.518185
124	75	17	0	3	Manager	2026-09-10 16:44:34.52881
126	76	1	5	4	Manager	2026-09-10 16:44:34.544523
127	76	4	5	3	Manager	2026-09-10 16:44:34.579321
128	76	5	3	4	Manager	2026-09-10 16:44:34.587817
129	76	7	5	4	Manager	2026-09-10 16:44:34.601053
130	76	8	3	4	Manager	2026-09-10 16:44:34.611411
132	76	11	3	2	Manager	2026-09-10 16:44:34.634196
134	76	14	0	2	Manager	2026-09-10 16:44:34.710619
135	76	15	0	3	Manager	2026-09-10 16:44:34.716963
137	76	17	0	2	Manager	2026-09-10 16:44:34.730381
138	76	18	0	3	Manager	2026-09-10 16:44:34.740245
139	77	1	4	5	Manager	2026-09-10 16:44:34.747096
140	77	3	4	5	Manager	2026-09-10 16:44:34.762008
141	77	4	5	4	Manager	2026-09-10 16:44:34.768066
143	77	6	5	4	Manager	2026-09-10 16:44:34.781078
144	77	9	4	5	Manager	2026-09-10 16:44:34.800424
145	77	10	0	5	Manager	2026-09-10 16:44:34.808902
146	77	11	0	3	Manager	2026-09-10 16:44:34.813915
148	77	13	0	4	Manager	2026-09-10 16:44:34.82614
149	77	14	0	4	Manager	2026-09-10 16:44:34.831139
151	77	16	0	3	Manager	2026-09-10 16:44:34.84379
152	77	17	0	4	Manager	2026-09-10 16:44:34.848807
154	78	1	4	3	Manager	2026-09-10 16:44:34.863858
155	78	2	5	2	Manager	2026-09-10 16:44:34.872915
156	78	3	3	5	Manager	2026-09-10 16:44:34.879012
158	78	5	5	2	Manager	2026-09-10 16:44:34.894406
159	78	6	3	2	Manager	2026-09-10 16:44:34.900961
161	78	8	5	2	Manager	2026-09-10 16:44:34.916484
163	78	11	0	2	Manager	2026-09-10 16:44:34.934172
164	78	12	0	2	Manager	2026-09-10 16:44:34.942121
165	78	13	0	3	Manager	2026-09-10 16:44:34.946807
167	78	15	0	3	Manager	2026-09-10 16:44:34.960116
168	78	16	0	2	Manager	2026-09-10 16:44:34.964713
170	78	18	0	2	Manager	2026-09-10 16:44:34.976812
171	79	1	5	3	Manager	2026-09-10 16:44:34.98262
172	79	4	5	3	Manager	2026-09-10 16:44:35.007942
173	79	8	3	5	Manager	2026-09-10 16:44:35.033979
175	79	10	0	3	Manager	2026-09-10 16:44:35.049192
176	79	11	0	3	Manager	2026-09-10 16:44:35.056324
178	79	13	0	3	Manager	2026-09-10 16:44:35.069203
179	79	14	0	3	Manager	2026-09-10 16:44:35.076294
180	79	15	0	2	Manager	2026-09-10 16:44:35.081821
182	79	17	0	2	Manager	2026-09-10 16:44:35.09298
183	79	18	0	3	Manager	2026-09-10 16:44:35.104987
185	80	2	4	1	Manager	2026-09-10 16:44:35.118203
186	80	3	5	1	Manager	2026-09-10 16:44:35.126582
188	80	5	4	1	Manager	2026-09-10 16:44:35.139369
189	80	6	5	2	Manager	2026-09-10 16:44:35.146059
190	80	7	3	2	Manager	2026-09-10 16:44:35.152999
192	80	9	5	1	Manager	2026-09-10 16:44:35.165812
193	80	10	3	1	Manager	2026-09-10 16:44:35.17388
194	80	12	3	1	Manager	2026-09-10 16:44:35.18412
195	80	13	0	3	Manager	2026-09-10 16:44:35.191179
197	80	15	0	1	Manager	2026-09-10 16:44:35.206561
198	80	16	0	3	Manager	2026-09-10 16:44:35.212102
199	80	17	0	3	Manager	2026-09-10 16:44:35.215672
201	81	1	4	3	Manager	2026-09-10 16:44:35.22812
202	81	2	5	3	Manager	2026-09-10 16:44:35.232649
204	81	4	4	2	Manager	2026-09-10 16:44:35.248903
205	81	5	5	3	Manager	2026-09-10 16:44:35.258249
207	81	7	4	2	Manager	2026-09-10 16:44:35.271999
208	81	8	5	3	Manager	2026-09-10 16:44:35.278361
209	81	9	3	2	Manager	2026-09-10 16:44:35.283884
211	81	11	0	3	Manager	2026-09-10 16:44:35.294588
212	81	12	0	5	Manager	2026-09-10 16:44:35.299306
214	81	14	0	5	Manager	2026-09-10 16:44:35.310373
215	81	15	0	5	Manager	2026-09-10 16:44:35.314625
217	81	17	0	3	Manager	2026-09-10 16:44:35.324759
218	81	18	0	3	Manager	2026-09-10 16:44:35.329574
219	82	6	4	5	Manager	2026-09-10 16:44:35.366803
220	82	10	0	5	Manager	2026-09-10 16:44:35.391042
221	82	11	0	4	Manager	2026-09-10 16:44:35.39615
223	82	13	0	3	Manager	2026-09-10 16:44:35.408208
224	82	14	0	5	Manager	2026-09-10 16:44:35.413215
226	82	16	0	3	Manager	2026-09-10 16:44:35.426448
227	82	17	0	4	Manager	2026-09-10 16:44:35.431029
229	83	1	3	4	Manager	2026-09-10 16:44:35.442236
230	83	3	5	3	Manager	2026-09-10 16:44:35.456835
231	83	5	4	3	Manager	2026-09-10 16:44:35.489276
232	83	6	5	3	Manager	2026-09-10 16:44:35.495026
234	83	8	4	3	Manager	2026-09-10 16:44:35.50795
235	83	9	5	2	Manager	2026-09-10 16:44:35.512976
237	83	11	0	2	Manager	2026-09-10 16:44:35.52667
238	83	12	0	2	Manager	2026-09-10 16:44:35.531383
239	83	13	0	3	Manager	2026-09-10 16:44:35.537923
241	83	15	0	3	Manager	2026-09-10 16:44:35.548099
242	83	16	0	2	Manager	2026-09-10 16:44:35.552122
244	83	18	0	3	Manager	2026-09-10 16:44:35.563873
245	84	1	0	2	Manager	2026-09-10 16:44:35.56697
247	84	3	0	2	Manager	2026-09-10 16:44:35.578986
248	84	4	0	3	Manager	2026-09-10 16:44:35.582987
249	84	5	0	2	Manager	2026-09-10 16:44:35.588728
251	84	7	0	2	Manager	2026-09-10 16:44:35.597959
252	84	8	0	3	Manager	2026-09-10 16:44:35.602982
106	74	16	0	4	Manager	2026-09-10 16:44:34.362091
109	75	1	4	2	Manager	2026-09-10 16:44:34.39631
112	75	4	4	3	Manager	2026-09-10 16:44:34.418258
115	75	8	5	2	Manager	2026-09-10 16:44:34.458265
118	75	11	0	3	Manager	2026-09-10 16:44:34.481198
121	75	14	0	2	Manager	2026-09-10 16:44:34.506478
125	75	18	0	2	Manager	2026-09-10 16:44:34.533886
131	76	10	3	2	Manager	2026-09-10 16:44:34.626872
133	76	13	0	2	Manager	2026-09-10 16:44:34.678219
136	76	16	0	3	Manager	2026-09-10 16:44:34.724584
142	77	5	4	5	Manager	2026-09-10 16:44:34.775609
147	77	12	0	5	Manager	2026-09-10 16:44:34.82107
150	77	15	0	5	Manager	2026-09-10 16:44:34.838265
153	77	18	0	4	Manager	2026-09-10 16:44:34.856385
157	78	4	4	3	Manager	2026-09-10 16:44:34.886891
160	78	7	4	2	Manager	2026-09-10 16:44:34.910014
162	78	10	0	3	Manager	2026-09-10 16:44:34.929126
166	78	14	0	2	Manager	2026-09-10 16:44:34.951812
169	78	17	0	2	Manager	2026-09-10 16:44:34.970459
174	79	9	4	3	Manager	2026-09-10 16:44:35.043037
177	79	12	0	2	Manager	2026-09-10 16:44:35.062886
181	79	16	0	3	Manager	2026-09-10 16:44:35.087937
184	80	1	3	1	Manager	2026-09-10 16:44:35.112993
187	80	4	3	1	Manager	2026-09-10 16:44:35.131236
191	80	8	4	1	Manager	2026-09-10 16:44:35.160244
196	80	14	0	1	Manager	2026-09-10 16:44:35.197929
200	80	18	0	3	Manager	2026-09-10 16:44:35.222816
203	81	3	3	2	Manager	2026-09-10 16:44:35.240282
206	81	6	3	2	Manager	2026-09-10 16:44:35.262246
210	81	10	0	5	Manager	2026-09-10 16:44:35.290983
213	81	13	0	4	Manager	2026-09-10 16:44:35.305673
216	81	16	0	4	Manager	2026-09-10 16:44:35.320455
222	82	12	0	5	Manager	2026-09-10 16:44:35.401148
225	82	15	0	5	Manager	2026-09-10 16:44:35.418019
228	82	18	0	3	Manager	2026-09-10 16:44:35.437225
233	83	7	3	2	Manager	2026-09-10 16:44:35.500034
236	83	10	0	2	Manager	2026-09-10 16:44:35.521148
240	83	14	0	2	Manager	2026-09-10 16:44:35.543019
243	83	17	0	3	Manager	2026-09-10 16:44:35.559267
246	84	2	0	2	Manager	2026-09-10 16:44:35.573889
250	84	6	0	2	Manager	2026-09-10 16:44:35.593826
253	84	9	0	3	Manager	2026-09-10 16:44:35.608352
257	84	16	0	3	Manager	2026-09-10 16:44:35.642206
260	85	1	4	5	Manager	2026-09-10 16:44:35.657069
266	85	11	0	4	Manager	2026-09-10 16:44:35.710235
269	85	14	0	4	Manager	2026-09-10 16:44:35.726706
273	85	18	0	4	Manager	2026-09-10 16:44:35.745917
276	86	3	5	4	Manager	2026-09-10 16:44:35.762231
280	86	10	0	2	Manager	2026-09-10 16:44:35.808868
283	86	13	0	2	Manager	2026-09-10 16:44:35.827066
286	86	16	0	2	Manager	2026-09-10 16:44:35.844666
290	87	2	5	3	Manager	2026-09-10 16:44:35.867884
293	87	5	5	2	Manager	2026-09-10 16:44:35.884881
295	87	8	5	3	Manager	2026-09-10 16:44:35.905117
298	87	12	0	3	Manager	2026-09-10 16:44:35.928244
301	87	15	0	3	Manager	2026-09-10 16:44:35.94496
304	87	18	0	2	Manager	2026-09-10 16:44:35.960649
308	88	4	0	1	Manager	2026-09-10 16:44:35.982056
311	88	7	0	2	Manager	2026-09-10 16:44:35.998061
314	88	10	0	2	Manager	2026-09-10 16:44:36.015765
318	88	14	0	2	Manager	2026-09-10 16:44:36.046616
320	88	17	3	5	Manager	2026-09-10 16:44:36.066979
323	89	6	5	4	Manager	2026-09-10 16:44:36.123951
325	89	9	5	2	Manager	2026-09-10 16:44:36.152921
328	89	12	0	3	Manager	2026-09-10 16:44:36.178189
332	89	16	0	3	Manager	2026-09-10 16:44:36.211867
335	90	1	0	1	Manager	2026-09-10 16:44:36.230911
338	90	4	0	1	Manager	2026-09-10 16:44:36.248932
342	90	8	0	1	Manager	2026-09-10 16:44:36.276286
346	90	14	0	2	Manager	2026-09-10 16:44:36.308108
348	90	18	3	5	Manager	2026-09-10 16:44:36.3266
350	91	3	4	2	Manager	2026-09-10 16:44:36.3441
353	91	6	4	3	Manager	2026-09-10 16:44:36.35844
357	91	10	0	2	Manager	2026-09-10 16:44:36.379347
360	91	13	0	3	Manager	2026-09-10 16:44:36.404979
363	91	16	0	3	Manager	2026-09-10 16:44:36.417005
367	92	2	0	3	Manager	2026-09-10 16:44:36.441836
370	92	5	0	2	Manager	2026-09-10 16:44:36.459907
373	92	8	0	3	Manager	2026-09-10 16:44:36.476547
377	92	12	4	5	Manager	2026-09-10 16:44:36.500171
382	92	18	0	4	Manager	2026-09-10 16:44:36.532793
386	93	4	4	2	Manager	2026-09-10 16:44:36.559946
388	93	7	4	3	Manager	2026-09-10 16:44:36.577824
391	93	10	0	3	Manager	2026-09-10 16:44:36.594585
395	93	14	0	2	Manager	2026-09-10 16:44:36.614649
398	93	17	0	3	Manager	2026-09-10 16:44:36.631053
401	94	2	0	2	Manager	2026-09-10 16:44:36.648222
405	94	6	0	1	Manager	2026-09-10 16:44:36.669785
408	94	9	4	2	Manager	2026-09-10 16:44:36.686322
411	94	12	0	2	Manager	2026-09-10 16:44:36.706312
417	95	4	3	4	Manager	2026-09-10 16:44:36.762211
422	95	11	0	3	Manager	2026-09-10 16:44:36.801024
425	95	14	0	2	Manager	2026-09-10 16:44:36.816673
429	95	18	0	2	Manager	2026-09-10 16:44:36.840419
432	96	3	0	1	Manager	2026-09-10 16:44:36.856767
435	96	6	0	1	Manager	2026-09-10 16:44:36.87496
439	96	10	0	2	Manager	2026-09-10 16:44:36.898381
442	96	13	4	5	Manager	2026-09-10 16:44:36.918129
448	97	5	4	5	Manager	2026-09-10 16:44:36.98381
453	97	12	0	5	Manager	2026-09-10 16:44:37.030949
456	97	15	0	5	Manager	2026-09-10 16:44:37.051022
459	97	18	0	4	Manager	2026-09-10 16:44:37.068059
463	98	4	0	2	Manager	2026-09-10 16:44:37.092591
466	98	7	0	2	Manager	2026-09-10 16:44:37.109196
469	98	10	4	5	Manager	2026-09-10 16:44:37.12732
473	98	14	4	5	Manager	2026-09-10 16:44:37.15099
475	98	17	0	4	Manager	2026-09-10 16:44:37.17077
254	84	11	0	4	Manager	2026-09-10 16:44:35.616744
255	84	13	0	4	Manager	2026-09-10 16:44:35.626263
256	84	14	4	5	Manager	2026-09-10 16:44:35.631981
258	84	17	0	4	Manager	2026-09-10 16:44:35.646913
259	84	18	0	4	Manager	2026-09-10 16:44:35.649903
261	85	3	4	5	Manager	2026-09-10 16:44:35.666399
262	85	5	4	5	Manager	2026-09-10 16:44:35.677931
263	85	6	5	4	Manager	2026-09-10 16:44:35.682743
264	85	9	4	5	Manager	2026-09-10 16:44:35.699415
265	85	10	0	5	Manager	2026-09-10 16:44:35.705518
267	85	12	0	5	Manager	2026-09-10 16:44:35.716389
268	85	13	0	3	Manager	2026-09-10 16:44:35.722924
270	85	15	0	5	Manager	2026-09-10 16:44:35.730395
271	85	16	0	4	Manager	2026-09-10 16:44:35.734574
272	85	17	0	3	Manager	2026-09-10 16:44:35.741223
274	86	1	3	4	Manager	2026-09-10 16:44:35.749922
275	86	2	4	5	Manager	2026-09-10 16:44:35.757086
277	86	4	3	5	Manager	2026-09-10 16:44:35.766773
278	86	5	4	5	Manager	2026-09-10 16:44:35.776569
279	86	9	5	4	Manager	2026-09-10 16:44:35.801161
281	86	11	0	3	Manager	2026-09-10 16:44:35.814078
282	86	12	0	3	Manager	2026-09-10 16:44:35.822147
284	86	14	0	3	Manager	2026-09-10 16:44:35.832036
285	86	15	0	2	Manager	2026-09-10 16:44:35.839558
287	86	17	0	3	Manager	2026-09-10 16:44:35.849213
288	86	18	0	2	Manager	2026-09-10 16:44:35.857338
289	87	1	4	3	Manager	2026-09-10 16:44:35.862266
291	87	3	3	4	Manager	2026-09-10 16:44:35.874994
292	87	4	4	2	Manager	2026-09-10 16:44:35.880078
294	87	7	4	3	Manager	2026-09-10 16:44:35.898154
296	87	10	0	3	Manager	2026-09-10 16:44:35.915719
297	87	11	0	3	Manager	2026-09-10 16:44:35.92422
299	87	13	0	3	Manager	2026-09-10 16:44:35.932781
300	87	14	0	3	Manager	2026-09-10 16:44:35.940044
302	87	16	0	3	Manager	2026-09-10 16:44:35.949829
303	87	17	0	2	Manager	2026-09-10 16:44:35.95599
305	88	1	0	2	Manager	2026-09-10 16:44:35.965004
306	88	2	0	1	Manager	2026-09-10 16:44:35.9719
307	88	3	0	1	Manager	2026-09-10 16:44:35.976433
309	88	5	0	2	Manager	2026-09-10 16:44:35.987828
310	88	6	0	1	Manager	2026-09-10 16:44:35.992856
312	88	8	0	1	Manager	2026-09-10 16:44:36.005436
313	88	9	4	1	Manager	2026-09-10 16:44:36.011173
315	88	11	3	4	Manager	2026-09-10 16:44:36.025871
316	88	12	0	3	Manager	2026-09-10 16:44:36.032896
317	88	13	5	4	Manager	2026-09-10 16:44:36.043093
319	88	15	0	2	Manager	2026-09-10 16:44:36.05387
321	88	18	4	5	Manager	2026-09-10 16:44:36.074965
322	89	3	5	2	Manager	2026-09-10 16:44:36.098938
324	89	8	4	2	Manager	2026-09-10 16:44:36.143785
326	89	10	0	2	Manager	2026-09-10 16:44:36.164002
327	89	11	0	2	Manager	2026-09-10 16:44:36.172146
329	89	13	0	3	Manager	2026-09-10 16:44:36.184308
330	89	14	0	3	Manager	2026-09-10 16:44:36.194509
331	89	15	0	3	Manager	2026-09-10 16:44:36.200233
333	89	17	0	3	Manager	2026-09-10 16:44:36.221106
334	89	18	0	3	Manager	2026-09-10 16:44:36.225987
336	90	2	0	2	Manager	2026-09-10 16:44:36.239709
337	90	3	0	1	Manager	2026-09-10 16:44:36.245193
339	90	5	0	2	Manager	2026-09-10 16:44:36.257997
340	90	6	0	1	Manager	2026-09-10 16:44:36.264706
341	90	7	0	1	Manager	2026-09-10 16:44:36.270224
343	90	9	3	1	Manager	2026-09-10 16:44:36.282857
344	90	10	0	2	Manager	2026-09-10 16:44:36.288193
345	90	12	0	3	Manager	2026-09-10 16:44:36.298161
347	90	15	0	3	Manager	2026-09-10 16:44:36.312223
349	91	1	5	3	Manager	2026-09-10 16:44:36.330292
351	91	4	5	3	Manager	2026-09-10 16:44:36.34831
352	91	5	3	2	Manager	2026-09-10 16:44:36.353148
354	91	7	5	4	Manager	2026-09-10 16:44:36.363238
355	91	8	3	4	Manager	2026-09-10 16:44:36.367933
356	91	9	4	2	Manager	2026-09-10 16:44:36.374548
358	91	11	0	2	Manager	2026-09-10 16:44:36.384192
359	91	12	0	2	Manager	2026-09-10 16:44:36.39914
361	91	14	0	2	Manager	2026-09-10 16:44:36.408838
362	91	15	0	2	Manager	2026-09-10 16:44:36.412884
364	91	17	0	2	Manager	2026-09-10 16:44:36.423112
365	91	18	0	3	Manager	2026-09-10 16:44:36.427921
366	92	1	0	2	Manager	2026-09-10 16:44:36.432798
368	92	3	0	3	Manager	2026-09-10 16:44:36.446362
369	92	4	0	3	Manager	2026-09-10 16:44:36.452883
371	92	6	0	2	Manager	2026-09-10 16:44:36.464461
372	92	7	0	2	Manager	2026-09-10 16:44:36.471034
374	92	9	0	2	Manager	2026-09-10 16:44:36.481064
375	92	10	4	5	Manager	2026-09-10 16:44:36.488065
376	92	11	0	4	Manager	2026-09-10 16:44:36.494074
378	92	13	0	4	Manager	2026-09-10 16:44:36.506701
379	92	14	4	5	Manager	2026-09-10 16:44:36.511723
380	92	16	0	3	Manager	2026-09-10 16:44:36.523914
381	92	17	0	3	Manager	2026-09-10 16:44:36.528794
383	93	1	4	3	Manager	2026-09-10 16:44:36.540831
384	93	2	5	3	Manager	2026-09-10 16:44:36.545907
385	93	3	3	4	Manager	2026-09-10 16:44:36.550915
387	93	5	5	3	Manager	2026-09-10 16:44:36.565474
389	93	8	5	3	Manager	2026-09-10 16:44:36.582824
390	93	9	3	4	Manager	2026-09-10 16:44:36.59007
392	93	11	0	2	Manager	2026-09-10 16:44:36.599696
393	93	12	0	3	Manager	2026-09-10 16:44:36.60594
394	93	13	0	3	Manager	2026-09-10 16:44:36.610397
396	93	15	0	2	Manager	2026-09-10 16:44:36.620386
397	93	16	0	3	Manager	2026-09-10 16:44:36.625834
399	93	18	0	2	Manager	2026-09-10 16:44:36.635855
400	94	1	0	2	Manager	2026-09-10 16:44:36.642924
402	94	3	0	2	Manager	2026-09-10 16:44:36.652976
403	94	4	0	2	Manager	2026-09-10 16:44:36.660227
404	94	5	0	2	Manager	2026-09-10 16:44:36.664794
406	94	7	0	1	Manager	2026-09-10 16:44:36.675319
407	94	8	0	1	Manager	2026-09-10 16:44:36.679873
409	94	10	0	3	Manager	2026-09-10 16:44:36.693852
410	94	11	3	4	Manager	2026-09-10 16:44:36.699348
412	94	14	0	3	Manager	2026-09-10 16:44:36.715699
413	94	15	0	2	Manager	2026-09-10 16:44:36.721887
414	94	17	3	5	Manager	2026-09-10 16:44:36.732214
415	95	2	4	3	Manager	2026-09-10 16:44:36.749965
416	95	3	5	4	Manager	2026-09-10 16:44:36.757089
418	95	5	4	5	Manager	2026-09-10 16:44:36.767778
419	95	6	5	4	Manager	2026-09-10 16:44:36.775305
420	95	9	5	4	Manager	2026-09-10 16:44:36.791673
421	95	10	0	2	Manager	2026-09-10 16:44:36.796401
423	95	12	0	3	Manager	2026-09-10 16:44:36.807917
424	95	13	0	3	Manager	2026-09-10 16:44:36.812011
426	95	15	0	3	Manager	2026-09-10 16:44:36.823002
427	95	16	0	3	Manager	2026-09-10 16:44:36.8266
428	95	17	0	2	Manager	2026-09-10 16:44:36.83073
430	96	1	0	1	Manager	2026-09-10 16:44:36.845736
431	96	2	0	1	Manager	2026-09-10 16:44:36.849823
433	96	4	0	1	Manager	2026-09-10 16:44:36.863993
434	96	5	0	1	Manager	2026-09-10 16:44:36.868303
436	96	7	0	2	Manager	2026-09-10 16:44:36.879959
437	96	8	0	1	Manager	2026-09-10 16:44:36.885509
438	96	9	3	1	Manager	2026-09-10 16:44:36.89277
440	96	11	5	4	Manager	2026-09-10 16:44:36.905184
441	96	12	0	3	Manager	2026-09-10 16:44:36.910172
443	96	14	0	2	Manager	2026-09-10 16:44:36.924944
444	96	15	0	2	Manager	2026-09-10 16:44:36.930381
445	96	18	3	4	Manager	2026-09-10 16:44:36.949465
446	97	1	4	5	Manager	2026-09-10 16:44:36.958411
447	97	3	4	5	Manager	2026-09-10 16:44:36.967981
449	97	7	4	5	Manager	2026-09-10 16:44:36.999238
450	97	9	4	5	Manager	2026-09-10 16:44:37.013034
451	97	10	0	5	Manager	2026-09-10 16:44:37.016581
452	97	11	0	4	Manager	2026-09-10 16:44:37.025842
454	97	13	0	4	Manager	2026-09-10 16:44:37.039012
455	97	14	0	5	Manager	2026-09-10 16:44:37.046019
457	97	16	0	4	Manager	2026-09-10 16:44:37.058913
458	97	17	0	4	Manager	2026-09-10 16:44:37.06295
460	98	1	0	2	Manager	2026-09-10 16:44:37.075048
461	98	2	0	2	Manager	2026-09-10 16:44:37.080002
462	98	3	0	2	Manager	2026-09-10 16:44:37.085549
464	98	5	0	2	Manager	2026-09-10 16:44:37.097117
465	98	6	0	2	Manager	2026-09-10 16:44:37.104144
467	98	8	0	3	Manager	2026-09-10 16:44:37.113716
468	98	9	0	3	Manager	2026-09-10 16:44:37.119263
470	98	11	0	4	Manager	2026-09-10 16:44:37.131836
471	98	12	4	5	Manager	2026-09-10 16:44:37.139922
472	98	13	0	4	Manager	2026-09-10 16:44:37.144448
474	98	16	0	3	Manager	2026-09-10 16:44:37.164732
476	98	18	0	3	Manager	2026-09-10 16:44:37.176386
478	99	3	3	5	Manager	2026-09-10 16:44:37.194549
479	99	4	4	3	Manager	2026-09-10 16:44:37.208141
480	99	5	5	3	Manager	2026-09-10 16:44:37.215679
482	99	8	5	4	Manager	2026-09-10 16:44:37.242503
484	99	10	0	2	Manager	2026-09-10 16:44:37.263776
485	99	11	0	2	Manager	2026-09-10 16:44:37.270696
487	99	13	0	3	Manager	2026-09-10 16:44:37.281113
488	99	14	0	3	Manager	2026-09-10 16:44:37.286837
489	99	15	0	2	Manager	2026-09-10 16:44:37.291827
491	99	17	0	3	Manager	2026-09-10 16:44:37.301087
492	99	18	0	3	Manager	2026-09-10 16:44:37.306785
494	100	2	0	2	Manager	2026-09-10 16:44:37.316906
495	100	3	0	2	Manager	2026-09-10 16:44:37.323937
497	100	5	0	1	Manager	2026-09-10 16:44:37.331947
498	100	6	0	2	Manager	2026-09-10 16:44:37.33668
499	100	7	0	1	Manager	2026-09-10 16:44:37.343006
501	100	9	4	1	Manager	2026-09-10 16:44:37.350449
502	100	10	0	3	Manager	2026-09-10 16:44:37.356734
504	100	12	0	3	Manager	2026-09-10 16:44:37.366593
506	100	15	0	2	Manager	2026-09-10 16:44:37.380959
507	100	17	3	5	Manager	2026-09-10 16:44:37.392058
508	101	1	3	4	Manager	2026-09-10 16:44:37.404028
509	101	2	4	5	Manager	2026-09-10 16:44:37.408317
511	101	4	3	5	Manager	2026-09-10 16:44:37.419478
512	101	5	4	5	Manager	2026-09-10 16:44:37.425097
514	101	7	3	4	Manager	2026-09-10 16:44:37.435821
515	101	9	5	4	Manager	2026-09-10 16:44:37.446613
517	101	11	0	2	Manager	2026-09-10 16:44:37.458094
518	101	12	0	3	Manager	2026-09-10 16:44:37.461799
520	101	14	0	3	Manager	2026-09-10 16:44:37.471884
521	101	15	0	2	Manager	2026-09-10 16:44:37.476073
523	101	17	0	2	Manager	2026-09-10 16:44:37.484105
524	101	18	0	2	Manager	2026-09-10 16:44:37.490469
525	102	1	0	1	Manager	2026-09-10 16:44:37.49629
527	102	3	0	1	Manager	2026-09-10 16:44:37.506635
528	102	4	0	1	Manager	2026-09-10 16:44:37.511928
530	102	6	0	1	Manager	2026-09-10 16:44:37.523137
531	102	7	0	1	Manager	2026-09-10 16:44:37.527912
533	102	9	3	1	Manager	2026-09-10 16:44:37.537914
534	102	10	0	3	Manager	2026-09-10 16:44:37.543003
535	102	11	5	4	Manager	2026-09-10 16:44:37.546647
537	102	13	4	5	Manager	2026-09-10 16:44:37.558007
538	102	14	0	3	Manager	2026-09-10 16:44:37.562195
540	102	16	4	5	Manager	2026-09-10 16:44:37.572765
542	103	1	5	3	Manager	2026-09-10 16:44:37.588137
543	103	2	3	4	Manager	2026-09-10 16:44:37.592165
546	103	8	3	4	Manager	2026-09-10 16:44:37.621806
548	103	11	0	3	Manager	2026-09-10 16:44:37.633956
549	103	12	0	2	Manager	2026-09-10 16:44:37.640086
550	103	13	0	3	Manager	2026-09-10 16:44:37.644021
552	103	15	0	3	Manager	2026-09-10 16:44:37.650363
553	103	16	0	3	Manager	2026-09-10 16:44:37.656731
555	103	18	0	3	Manager	2026-09-10 16:44:37.665526
556	104	1	0	2	Manager	2026-09-10 16:44:37.669119
558	104	3	0	3	Manager	2026-09-10 16:44:37.678917
559	104	4	0	3	Manager	2026-09-10 16:44:37.681918
477	99	2	5	3	Manager	2026-09-10 16:44:37.18916
481	99	6	3	4	Manager	2026-09-10 16:44:37.224854
483	99	9	3	5	Manager	2026-09-10 16:44:37.254407
486	99	12	0	2	Manager	2026-09-10 16:44:37.277127
490	99	16	0	3	Manager	2026-09-10 16:44:37.296436
493	100	1	0	2	Manager	2026-09-10 16:44:37.312133
496	100	4	0	1	Manager	2026-09-10 16:44:37.328266
500	100	8	0	1	Manager	2026-09-10 16:44:37.346746
503	100	11	3	5	Manager	2026-09-10 16:44:37.362023
505	100	14	0	2	Manager	2026-09-10 16:44:37.375963
510	101	3	5	4	Manager	2026-09-10 16:44:37.41311
513	101	6	5	4	Manager	2026-09-10 16:44:37.430012
516	101	10	0	3	Manager	2026-09-10 16:44:37.450226
519	101	13	0	2	Manager	2026-09-10 16:44:37.46546
522	101	16	0	3	Manager	2026-09-10 16:44:37.480152
526	102	2	0	1	Manager	2026-09-10 16:44:37.500391
529	102	5	0	1	Manager	2026-09-10 16:44:37.516549
532	102	8	0	1	Manager	2026-09-10 16:44:37.53191
536	102	12	0	3	Manager	2026-09-10 16:44:37.550311
539	102	15	0	3	Manager	2026-09-10 16:44:37.566818
541	102	18	3	5	Manager	2026-09-10 16:44:37.582047
544	103	4	5	4	Manager	2026-09-10 16:44:37.600666
545	103	7	5	4	Manager	2026-09-10 16:44:37.615766
547	103	10	0	3	Manager	2026-09-10 16:44:37.630556
551	103	14	0	3	Manager	2026-09-10 16:44:37.646649
554	103	17	0	3	Manager	2026-09-10 16:44:37.660503
557	104	2	0	3	Manager	2026-09-10 16:44:37.674935
561	104	6	0	3	Manager	2026-09-10 16:44:37.691948
564	104	9	0	3	Manager	2026-09-10 16:44:37.704759
569	104	16	0	4	Manager	2026-09-10 16:44:37.737911
575	105	8	5	4	Manager	2026-09-10 16:44:37.788204
578	105	11	0	2	Manager	2026-09-10 16:44:37.801232
581	105	14	0	3	Manager	2026-09-10 16:44:37.814624
585	105	18	0	3	Manager	2026-09-10 16:44:37.831952
588	106	3	0	1	Manager	2026-09-10 16:44:37.846498
591	106	6	0	1	Manager	2026-09-10 16:44:37.859448
595	106	10	0	3	Manager	2026-09-10 16:44:37.878026
605	107	8	4	3	Manager	2026-09-10 16:44:37.955638
609	107	12	0	2	Manager	2026-09-10 16:44:37.976738
612	107	15	0	2	Manager	2026-09-10 16:44:37.993211
615	107	18	0	3	Manager	2026-09-10 16:44:38.010172
619	108	4	0	1	Manager	2026-09-10 16:44:38.032907
622	108	7	0	1	Manager	2026-09-10 16:44:38.048125
625	108	10	0	3	Manager	2026-09-10 16:44:38.062371
629	108	14	0	3	Manager	2026-09-10 16:44:38.088102
633	109	2	3	4	Manager	2026-09-10 16:44:38.115874
637	109	6	4	3	Manager	2026-09-10 16:44:38.138113
642	109	12	0	3	Manager	2026-09-10 16:44:38.170975
646	109	16	0	2	Manager	2026-09-10 16:44:38.190284
649	110	1	0	2	Manager	2026-09-10 16:44:38.206457
652	110	4	0	1	Manager	2026-09-10 16:44:38.220762
656	110	8	0	1	Manager	2026-09-10 16:44:38.240939
661	110	14	0	3	Manager	2026-09-10 16:44:38.270813
665	110	18	5	4	Manager	2026-09-10 16:44:38.291889
667	111	3	3	5	Manager	2026-09-10 16:44:38.306743
669	111	6	3	4	Manager	2026-09-10 16:44:38.320328
672	111	10	0	2	Manager	2026-09-10 16:44:38.340045
675	111	13	0	2	Manager	2026-09-10 16:44:38.350364
678	111	16	0	2	Manager	2026-09-10 16:44:38.365612
682	112	2	0	2	Manager	2026-09-10 16:44:38.384804
685	112	5	0	2	Manager	2026-09-10 16:44:38.399156
688	112	8	0	3	Manager	2026-09-10 16:44:38.41176
692	112	12	4	5	Manager	2026-09-10 16:44:38.43234
697	112	18	0	3	Manager	2026-09-10 16:44:38.460533
700	113	4	3	5	Manager	2026-09-10 16:44:38.479015
703	113	10	0	3	Manager	2026-09-10 16:44:38.510099
707	113	14	0	3	Manager	2026-09-10 16:44:38.528754
710	113	17	0	3	Manager	2026-09-10 16:44:38.543811
713	114	2	0	1	Manager	2026-09-10 16:44:38.559823
717	114	6	0	1	Manager	2026-09-10 16:44:38.577933
720	114	9	3	1	Manager	2026-09-10 16:44:38.593076
722	114	12	0	2	Manager	2026-09-10 16:44:38.606721
727	115	1	5	4	Manager	2026-09-10 16:44:38.640759
729	115	4	5	3	Manager	2026-09-10 16:44:38.652983
732	115	8	3	5	Manager	2026-09-10 16:44:38.674023
734	115	11	0	2	Manager	2026-09-10 16:44:38.688351
737	115	14	0	3	Manager	2026-09-10 16:44:38.700417
741	115	18	0	3	Manager	2026-09-10 16:44:38.722051
744	116	3	0	1	Manager	2026-09-10 16:44:38.733908
747	116	6	0	1	Manager	2026-09-10 16:44:38.748258
751	116	10	0	3	Manager	2026-09-10 16:44:38.766657
759	117	2	0	5	Manager	2026-09-10 16:44:38.815216
762	117	5	0	5	Manager	2026-09-10 16:44:38.831945
765	117	8	0	5	Manager	2026-09-10 16:44:38.846024
772	117	18	0	4	Manager	2026-09-10 16:44:38.893826
776	118	4	5	4	Manager	2026-09-10 16:44:38.917964
777	118	7	5	3	Manager	2026-09-10 16:44:38.931851
779	118	10	0	3	Manager	2026-09-10 16:44:38.94798
783	118	14	0	3	Manager	2026-09-10 16:44:38.967045
786	118	17	0	3	Manager	2026-09-10 16:44:38.982214
560	104	5	0	2	Manager	2026-09-10 16:44:37.686629
562	104	7	0	2	Manager	2026-09-10 16:44:37.695745
563	104	8	0	3	Manager	2026-09-10 16:44:37.699457
565	104	10	4	5	Manager	2026-09-10 16:44:37.708859
566	104	11	0	3	Manager	2026-09-10 16:44:37.71285
567	104	13	0	4	Manager	2026-09-10 16:44:37.723977
568	104	14	4	5	Manager	2026-09-10 16:44:37.72828
570	104	17	0	4	Manager	2026-09-10 16:44:37.743002
571	104	18	0	3	Manager	2026-09-10 16:44:37.746755
572	105	2	5	3	Manager	2026-09-10 16:44:37.757966
573	105	3	3	5	Manager	2026-09-10 16:44:37.763881
574	105	5	5	3	Manager	2026-09-10 16:44:37.773919
576	105	9	3	5	Manager	2026-09-10 16:44:37.791905
577	105	10	0	3	Manager	2026-09-10 16:44:37.796667
579	105	12	0	2	Manager	2026-09-10 16:44:37.806787
580	105	13	0	2	Manager	2026-09-10 16:44:37.810296
582	105	15	0	3	Manager	2026-09-10 16:44:37.820375
583	105	16	0	3	Manager	2026-09-10 16:44:37.824552
584	105	17	0	3	Manager	2026-09-10 16:44:37.828239
586	106	1	0	2	Manager	2026-09-10 16:44:37.837864
587	106	2	0	1	Manager	2026-09-10 16:44:37.842874
589	106	4	0	2	Manager	2026-09-10 16:44:37.849196
590	106	5	0	1	Manager	2026-09-10 16:44:37.854816
592	106	7	0	1	Manager	2026-09-10 16:44:37.864122
593	106	8	0	2	Manager	2026-09-10 16:44:37.867704
594	106	9	4	1	Manager	2026-09-10 16:44:37.872336
596	106	11	3	5	Manager	2026-09-10 16:44:37.882025
597	106	12	0	3	Manager	2026-09-10 16:44:37.887126
598	106	14	0	3	Manager	2026-09-10 16:44:37.895787
599	106	15	0	2	Manager	2026-09-10 16:44:37.899779
600	106	17	3	5	Manager	2026-09-10 16:44:37.909917
601	106	18	4	5	Manager	2026-09-10 16:44:37.914643
602	107	3	5	3	Manager	2026-09-10 16:44:37.928844
603	107	4	3	4	Manager	2026-09-10 16:44:37.932852
604	107	6	5	3	Manager	2026-09-10 16:44:37.944914
606	107	9	5	3	Manager	2026-09-10 16:44:37.961929
607	107	10	0	2	Manager	2026-09-10 16:44:37.965661
608	107	11	0	2	Manager	2026-09-10 16:44:37.971915
610	107	13	0	2	Manager	2026-09-10 16:44:37.981966
611	107	14	0	3	Manager	2026-09-10 16:44:37.98677
613	107	16	0	2	Manager	2026-09-10 16:44:37.999878
614	107	17	0	3	Manager	2026-09-10 16:44:38.006461
616	108	1	0	2	Manager	2026-09-10 16:44:38.014178
617	108	2	0	1	Manager	2026-09-10 16:44:38.018782
618	108	3	0	1	Manager	2026-09-10 16:44:38.02792
620	108	5	0	1	Manager	2026-09-10 16:44:38.040288
621	108	6	0	1	Manager	2026-09-10 16:44:38.043957
623	108	8	0	2	Manager	2026-09-10 16:44:38.053177
624	108	9	3	1	Manager	2026-09-10 16:44:38.059275
626	108	11	5	4	Manager	2026-09-10 16:44:38.066048
627	108	12	0	3	Manager	2026-09-10 16:44:38.078321
628	108	13	4	5	Manager	2026-09-10 16:44:38.082986
630	108	15	0	3	Manager	2026-09-10 16:44:38.092208
631	108	18	3	5	Manager	2026-09-10 16:44:38.106605
632	109	1	5	3	Manager	2026-09-10 16:44:38.111431
634	109	3	4	3	Manager	2026-09-10 16:44:38.122173
635	109	4	5	4	Manager	2026-09-10 16:44:38.126881
636	109	5	3	4	Manager	2026-09-10 16:44:38.131889
638	109	7	5	4	Manager	2026-09-10 16:44:38.143124
639	109	8	3	5	Manager	2026-09-10 16:44:38.148855
640	109	10	0	2	Manager	2026-09-10 16:44:38.160527
641	109	11	0	3	Manager	2026-09-10 16:44:38.164987
643	109	13	0	3	Manager	2026-09-10 16:44:38.176455
644	109	14	0	2	Manager	2026-09-10 16:44:38.181041
645	109	15	0	2	Manager	2026-09-10 16:44:38.184564
647	109	17	0	3	Manager	2026-09-10 16:44:38.195406
648	109	18	0	2	Manager	2026-09-10 16:44:38.200958
650	110	2	0	2	Manager	2026-09-10 16:44:38.210702
651	110	3	0	1	Manager	2026-09-10 16:44:38.214781
653	110	5	0	2	Manager	2026-09-10 16:44:38.226303
654	110	6	0	2	Manager	2026-09-10 16:44:38.229848
655	110	7	0	2	Manager	2026-09-10 16:44:38.234545
657	110	9	5	2	Manager	2026-09-10 16:44:38.246196
658	110	10	0	2	Manager	2026-09-10 16:44:38.250284
659	110	12	0	2	Manager	2026-09-10 16:44:38.260587
660	110	13	3	5	Manager	2026-09-10 16:44:38.265903
662	110	15	0	2	Manager	2026-09-10 16:44:38.275546
663	110	16	3	4	Manager	2026-09-10 16:44:38.280248
664	110	17	4	5	Manager	2026-09-10 16:44:38.28458
666	111	2	5	4	Manager	2026-09-10 16:44:38.301096
668	111	5	5	4	Manager	2026-09-10 16:44:38.314531
670	111	8	5	3	Manager	2026-09-10 16:44:38.328264
671	111	9	3	5	Manager	2026-09-10 16:44:38.333063
673	111	11	0	3	Manager	2026-09-10 16:44:38.344038
674	111	12	0	2	Manager	2026-09-10 16:44:38.34675
676	111	14	0	3	Manager	2026-09-10 16:44:38.35729
677	111	15	0	3	Manager	2026-09-10 16:44:38.361992
679	111	17	0	2	Manager	2026-09-10 16:44:38.370298
680	111	18	0	3	Manager	2026-09-10 16:44:38.3766
681	112	1	0	2	Manager	2026-09-10 16:44:38.381206
683	112	3	0	2	Manager	2026-09-10 16:44:38.390832
684	112	4	0	2	Manager	2026-09-10 16:44:38.395015
686	112	6	0	3	Manager	2026-09-10 16:44:38.404759
687	112	7	0	2	Manager	2026-09-10 16:44:38.407846
689	112	9	0	3	Manager	2026-09-10 16:44:38.416474
690	112	10	4	5	Manager	2026-09-10 16:44:38.423091
691	112	11	0	4	Manager	2026-09-10 16:44:38.427801
693	112	13	0	4	Manager	2026-09-10 16:44:38.438048
694	112	14	4	5	Manager	2026-09-10 16:44:38.44203
695	112	16	0	3	Manager	2026-09-10 16:44:38.450217
696	112	17	0	4	Manager	2026-09-10 16:44:38.455846
698	113	1	3	5	Manager	2026-09-10 16:44:38.464711
699	113	3	5	3	Manager	2026-09-10 16:44:38.473985
701	113	5	4	5	Manager	2026-09-10 16:44:38.484004
702	113	9	5	4	Manager	2026-09-10 16:44:38.506558
704	113	11	0	3	Manager	2026-09-10 16:44:38.514675
705	113	12	0	3	Manager	2026-09-10 16:44:38.51922
706	113	13	0	2	Manager	2026-09-10 16:44:38.524762
708	113	15	0	2	Manager	2026-09-10 16:44:38.532742
709	113	16	0	2	Manager	2026-09-10 16:44:38.538816
711	113	18	0	2	Manager	2026-09-10 16:44:38.547871
712	114	1	0	1	Manager	2026-09-10 16:44:38.553278
714	114	3	0	1	Manager	2026-09-10 16:44:38.562929
715	114	4	0	2	Manager	2026-09-10 16:44:38.566537
716	114	5	0	2	Manager	2026-09-10 16:44:38.572236
718	114	7	0	1	Manager	2026-09-10 16:44:38.581953
719	114	8	0	1	Manager	2026-09-10 16:44:38.586726
721	114	10	0	3	Manager	2026-09-10 16:44:38.59688
723	114	14	0	2	Manager	2026-09-10 16:44:38.614621
724	114	15	0	2	Manager	2026-09-10 16:44:38.62042
725	114	17	5	4	Manager	2026-09-10 16:44:38.628406
726	114	18	3	5	Manager	2026-09-10 16:44:38.633156
728	115	3	4	3	Manager	2026-09-10 16:44:38.64816
730	115	5	3	4	Manager	2026-09-10 16:44:38.65829
731	115	6	4	3	Manager	2026-09-10 16:44:38.662989
733	115	10	0	2	Manager	2026-09-10 16:44:38.683055
735	115	12	0	2	Manager	2026-09-10 16:44:38.692907
736	115	13	0	3	Manager	2026-09-10 16:44:38.697951
738	115	15	0	2	Manager	2026-09-10 16:44:38.707983
739	115	16	0	2	Manager	2026-09-10 16:44:38.711003
740	115	17	0	3	Manager	2026-09-10 16:44:38.715585
742	116	1	0	1	Manager	2026-09-10 16:44:38.725939
743	116	2	0	1	Manager	2026-09-10 16:44:38.729909
745	116	4	0	1	Manager	2026-09-10 16:44:38.740889
746	116	5	0	2	Manager	2026-09-10 16:44:38.744561
748	116	7	0	1	Manager	2026-09-10 16:44:38.754008
749	116	8	0	1	Manager	2026-09-10 16:44:38.758227
750	116	9	5	1	Manager	2026-09-10 16:44:38.762942
752	116	11	4	3	Manager	2026-09-10 16:44:38.774006
753	116	12	0	2	Manager	2026-09-10 16:44:38.778315
754	116	14	0	3	Manager	2026-09-10 16:44:38.788149
755	116	15	0	2	Manager	2026-09-10 16:44:38.792258
756	116	17	4	3	Manager	2026-09-10 16:44:38.800424
757	116	18	5	4	Manager	2026-09-10 16:44:38.806367
758	117	1	0	5	Manager	2026-09-10 16:44:38.811065
760	117	3	0	4	Manager	2026-09-10 16:44:38.823772
761	117	4	0	4	Manager	2026-09-10 16:44:38.827131
763	117	6	0	5	Manager	2026-09-10 16:44:38.838021
764	117	7	0	4	Manager	2026-09-10 16:44:38.842034
766	117	9	0	5	Manager	2026-09-10 16:44:38.849275
767	117	10	5	4	Manager	2026-09-10 16:44:38.856624
768	117	11	0	4	Manager	2026-09-10 16:44:38.860966
769	117	13	0	4	Manager	2026-09-10 16:44:38.872841
770	117	16	0	4	Manager	2026-09-10 16:44:38.886601
771	117	17	0	4	Manager	2026-09-10 16:44:38.891177
773	118	1	5	4	Manager	2026-09-10 16:44:38.899844
774	118	2	3	4	Manager	2026-09-10 16:44:38.906222
775	118	3	4	3	Manager	2026-09-10 16:44:38.912221
778	118	8	3	4	Manager	2026-09-10 16:44:38.93968
780	118	11	0	2	Manager	2026-09-10 16:44:38.953992
781	118	12	0	2	Manager	2026-09-10 16:44:38.959067
782	118	13	0	2	Manager	2026-09-10 16:44:38.962437
784	118	15	0	3	Manager	2026-09-10 16:44:38.972914
785	118	16	0	2	Manager	2026-09-10 16:44:38.97667
787	118	18	0	2	Manager	2026-09-10 16:44:38.989056
788	69	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.677964
789	69	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.696533
790	69	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.714017
791	69	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.736803
792	70	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.771241
793	70	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.780932
794	70	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.789118
795	70	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.805525
796	70	4	3	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.820597
797	70	4	1	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.828358
798	71	1	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.838319
799	71	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.854538
800	71	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.872501
801	71	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.886621
802	72	1	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.902315
803	72	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.919046
804	72	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.936511
805	72	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.950147
806	73	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.969284
807	73	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:31.987538
808	73	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.003788
809	73	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.022745
810	74	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.052969
811	74	4	5	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.11389
812	75	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.150994
813	75	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.305665
814	76	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.348666
815	76	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.429591
816	76	4	3	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.474325
817	76	4	1	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.499748
818	77	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.62733
819	78	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.660149
820	78	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.677723
821	78	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.752733
823	79	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.832576
824	79	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.862937
825	80	3	1	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.951063
826	81	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.004531
829	81	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.091051
830	82	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.155016
832	83	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.240083
833	83	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.27059
834	83	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.302582
835	83	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.342128
837	84	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.440291
838	84	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.479327
839	85	4	5	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.613092
840	86	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.637602
842	86	4	5	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.710717
843	87	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.735704
844	87	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.74644
845	87	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.785836
847	88	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.841911
848	88	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.908776
851	89	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.989143
852	89	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.001258
853	89	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.035848
854	89	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.060192
855	90	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.13409
856	90	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.152289
857	91	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.19688
860	91	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.278363
861	92	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.30482
862	92	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.358202
864	93	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.41234
865	93	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.426834
866	93	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.475033
867	93	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.50502
869	94	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.582385
870	94	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.62116
871	95	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.659868
873	95	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.714294
874	95	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.738982
877	96	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.847349
879	97	4	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.006731
880	98	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.024908
881	98	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.103183
882	98	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.133889
884	99	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.264677
885	100	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.29025
886	100	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.343225
887	101	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.413998
889	101	4	5	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.506893
890	102	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.600676
892	103	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.674162
893	103	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.708568
894	103	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.740419
895	103	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.778241
897	104	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.893951
898	104	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.950128
900	105	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.122347
901	106	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.171336
904	106	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.279365
905	107	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.310588
906	107	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.328003
907	107	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.347866
910	108	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.453834
911	108	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.522275
912	108	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.542016
915	109	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.64661
916	109	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.677899
917	109	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.71204
822	79	1	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:32.777013
827	81	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.019509
828	81	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.065084
831	82	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.211349
836	84	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.373991
841	86	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.688286
846	87	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.81218
849	88	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.926192
850	89	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:33.972247
858	91	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.209729
859	91	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.25593
863	92	4	3	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.384854
868	94	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.528171
875	96	1	1	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.788029
876	96	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.834023
878	97	4	5	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.986558
883	99	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.168722
888	101	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.473036
896	104	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.819025
899	105	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.992282
903	106	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.265524
908	107	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.378114
914	109	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.624884
918	110	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.74043
921	111	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.891112
924	112	3	2	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.043955
928	113	4	5	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.209438
932	115	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.386994
937	117	3	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.762942
942	118	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.964271
872	95	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:34.6745
891	102	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:35.621035
902	106	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.25028
909	107	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.413261
913	109	1	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.604958
925	112	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.082352
936	116	3	1	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.620125
938	117	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.80344
919	110	3	1	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.802435
920	111	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.865695
922	111	4	4	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.949096
923	112	1	2	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:36.973934
926	113	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.14388
927	113	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.175811
929	114	3	1	3	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.322303
930	114	3	3	4	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.338857
931	114	4	2	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.355398
933	115	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.469966
934	115	4	3	1	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.506358
935	115	4	1	2	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.526706
939	118	1	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.840256
940	118	2	4	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.878078
941	118	3	3	5	Submitted Performance Test Auto-Calculation	2026-09-10 16:45:37.921877
\.


--
-- Data for Name: styles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.styles (id, style_no, buyer, description, season, product_type, active, created_at, updated_at) FROM stdin;
2	ST-002	ajay trader	Men's Shirt	ss25	Shirt	t	2026-08-21 18:30:21.915359	2026-08-21 18:30:21.915359
3	ST-003	vertex trader	Men's pant	ss26	pant	t	2026-08-22 12:49:20.611363	2026-08-22 12:49:20.611363
5	STY-TSHIRT-480	Zara Men	Classic Crew Neck T-Shirt (Line Balance Benchmark)	Summer 2026	T-Shirt	t	2026-08-25 12:06:01.025026	2026-08-25 12:06:01.025026
1	ST-001	vijay traders	Men's T-Shirt	ss26	T-Shirt	t	2026-08-21 16:16:32.748969	2026-08-25 15:26:53.853737
18	STY-POLO-800	Nike Sportswear	Dri-FIT Men Athletic Pique Polo	Autumn 2026	Polo Shirt	t	2026-09-08 14:45:05.455252	2026-09-08 14:45:05.455252
19	STY-HOODIE-550	H&M Casuals	Heavyweight Fleece Pullover Hoodie	Winter 2026	Hoodie	t	2026-09-08 14:45:05.455252	2026-09-08 14:45:05.455252
20	STY-CHINO-620	Levi Strauss & Co	Slim Fit Stretch Chino Trouser	Spring 2026	Pants	t	2026-09-08 14:45:05.455252	2026-09-08 14:45:05.455252
21	STY-DENIM-900	Uniqlo LifeWear	Classic Trucker Denim Jacket	Summer 2026	Jacket	t	2026-09-08 14:45:05.455252	2026-09-08 14:45:05.455252
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 14, true);


--
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 242, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 2428, true);


--
-- Name: balance_station_operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.balance_station_operations_id_seq', 1, false);


--
-- Name: balance_workstations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.balance_workstations_id_seq', 1, false);


--
-- Name: bulletin_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bulletin_lines_id_seq', 60, true);


--
-- Name: capacity_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.capacity_plans_id_seq', 7, true);


--
-- Name: chat_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_conversations_id_seq', 106, true);


--
-- Name: chat_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_feedback_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 244, true);


--
-- Name: hourly_production_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hourly_production_entries_id_seq', 1, true);


--
-- Name: line_design_machines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.line_design_machines_id_seq', 18, true);


--
-- Name: line_designs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.line_designs_id_seq', 12, true);


--
-- Name: line_plan_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.line_plan_assignments_id_seq', 48, true);


--
-- Name: line_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.line_plans_id_seq', 7, true);


--
-- Name: machines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.machines_id_seq', 14, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 47, true);


--
-- Name: operation_affinities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operation_affinities_id_seq', 17, true);


--
-- Name: operation_bulletins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operation_bulletins_id_seq', 13, true);


--
-- Name: operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operations_id_seq', 19, true);


--
-- Name: operator_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operator_attachments_id_seq', 1, true);


--
-- Name: operator_performance_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operator_performance_logs_id_seq', 425, true);


--
-- Name: operator_station_placements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operator_station_placements_id_seq', 1, false);


--
-- Name: operators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operators_id_seq', 118, true);


--
-- Name: optimization_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.optimization_recommendations_id_seq', 1, false);


--
-- Name: order_size_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_size_lines_id_seq', 55, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 17, true);


--
-- Name: piece_production_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.piece_production_logs_id_seq', 70, true);


--
-- Name: sewing_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sewing_lines_id_seq', 6, true);


--
-- Name: shift_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_assignments_id_seq', 4, true);


--
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_id_seq', 6, true);


--
-- Name: sizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sizes_id_seq', 19, true);


--
-- Name: skill_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_assessments_id_seq', 3342, true);


--
-- Name: skill_matrix_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_matrix_history_id_seq', 942, true);


--
-- Name: styles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.styles_id_seq', 21, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: balance_station_operations balance_station_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_station_operations
    ADD CONSTRAINT balance_station_operations_pkey PRIMARY KEY (id);


--
-- Name: balance_workstations balance_workstations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_workstations
    ADD CONSTRAINT balance_workstations_pkey PRIMARY KEY (id);


--
-- Name: bulletin_lines bulletin_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_lines
    ADD CONSTRAINT bulletin_lines_pkey PRIMARY KEY (id);


--
-- Name: bulletin_styles bulletin_styles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_styles
    ADD CONSTRAINT bulletin_styles_pkey PRIMARY KEY (bulletin_id, style_id);


--
-- Name: capacity_plans capacity_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans
    ADD CONSTRAINT capacity_plans_pkey PRIMARY KEY (id);


--
-- Name: capacity_plans capacity_plans_plan_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans
    ADD CONSTRAINT capacity_plans_plan_code_key UNIQUE (plan_code);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_feedback chat_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_feedback
    ADD CONSTRAINT chat_feedback_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: hourly_production_entries hourly_production_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_production_entries
    ADD CONSTRAINT hourly_production_entries_pkey PRIMARY KEY (id);


--
-- Name: line_design_machines line_design_machines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_design_machines
    ADD CONSTRAINT line_design_machines_pkey PRIMARY KEY (id);


--
-- Name: line_designs line_designs_design_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_design_code_key UNIQUE (design_code);


--
-- Name: line_designs line_designs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_pkey PRIMARY KEY (id);


--
-- Name: line_plan_assignments line_plan_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plan_assignments
    ADD CONSTRAINT line_plan_assignments_pkey PRIMARY KEY (id);


--
-- Name: line_plans line_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plans
    ADD CONSTRAINT line_plans_pkey PRIMARY KEY (id);


--
-- Name: machines machines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: operation_affinities operation_affinities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_affinities
    ADD CONSTRAINT operation_affinities_pkey PRIMARY KEY (id);


--
-- Name: operation_bulletins operation_bulletins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_bulletins
    ADD CONSTRAINT operation_bulletins_pkey PRIMARY KEY (id);


--
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- Name: operator_attachments operator_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_attachments
    ADD CONSTRAINT operator_attachments_pkey PRIMARY KEY (id);


--
-- Name: operator_performance_logs operator_performance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_performance_logs
    ADD CONSTRAINT operator_performance_logs_pkey PRIMARY KEY (id);


--
-- Name: operator_station_placements operator_station_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_station_placements
    ADD CONSTRAINT operator_station_placements_pkey PRIMARY KEY (id);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- Name: optimization_recommendations optimization_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimization_recommendations
    ADD CONSTRAINT optimization_recommendations_pkey PRIMARY KEY (id);


--
-- Name: order_size_lines order_size_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_size_lines
    ADD CONSTRAINT order_size_lines_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: piece_production_logs piece_production_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piece_production_logs
    ADD CONSTRAINT piece_production_logs_pkey PRIMARY KEY (id);


--
-- Name: sewing_lines sewing_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sewing_lines
    ADD CONSTRAINT sewing_lines_pkey PRIMARY KEY (id);


--
-- Name: shift_assignments shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: sizes sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_pkey PRIMARY KEY (id);


--
-- Name: skill_assessments skill_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_assessments
    ADD CONSTRAINT skill_assessments_pkey PRIMARY KEY (id);


--
-- Name: skill_matrix_history skill_matrix_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_matrix_history
    ADD CONSTRAINT skill_matrix_history_pkey PRIMARY KEY (id);


--
-- Name: styles styles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.styles
    ADD CONSTRAINT styles_pkey PRIMARY KEY (id);


--
-- Name: operation_affinities uk_primary_alt_operation; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_affinities
    ADD CONSTRAINT uk_primary_alt_operation UNIQUE (primary_operation_id, alternative_operation_id);


--
-- Name: attendance_records uq_att_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT uq_att_unique UNIQUE (attendance_date, operator_id, shift_id);


--
-- Name: bulletin_lines uq_bl_bulletin_seq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_lines
    ADD CONSTRAINT uq_bl_bulletin_seq UNIQUE (bulletin_id, sequence);


--
-- Name: operation_bulletins uq_bulletins_code_version; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_bulletins
    ADD CONSTRAINT uq_bulletins_code_version UNIQUE (bulletin_code, version);


--
-- Name: balance_workstations uq_bw_design_station; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_workstations
    ADD CONSTRAINT uq_bw_design_station UNIQUE (line_design_id, station_index);


--
-- Name: hourly_production_entries uq_hpe_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_production_entries
    ADD CONSTRAINT uq_hpe_key UNIQUE (line_plan_id, operation_id, operator_id, log_date, shift_hour);


--
-- Name: machines uq_machines_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT uq_machines_code UNIQUE (machine_code);


--
-- Name: operations uq_operations_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT uq_operations_code UNIQUE (operation_code);


--
-- Name: operations uq_operations_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT uq_operations_name UNIQUE (name);


--
-- Name: operators uq_operators_employee_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT uq_operators_employee_id UNIQUE (employee_id);


--
-- Name: orders uq_orders_order_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT uq_orders_order_no UNIQUE (order_no);


--
-- Name: order_size_lines uq_osl_order_size; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_size_lines
    ADD CONSTRAINT uq_osl_order_size UNIQUE (order_id, size_id);


--
-- Name: sewing_lines uq_sewing_lines_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sewing_lines
    ADD CONSTRAINT uq_sewing_lines_code UNIQUE (line_code);


--
-- Name: shifts uq_shifts_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT uq_shifts_code UNIQUE (shift_code);


--
-- Name: sizes uq_sizes_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT uq_sizes_code UNIQUE (code);


--
-- Name: styles uq_styles_style_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.styles
    ADD CONSTRAINT uq_styles_style_no UNIQUE (style_no);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_activity_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);


--
-- Name: idx_activity_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs USING btree ("timestamp" DESC);


--
-- Name: idx_att_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_att_date ON public.attendance_records USING btree (attendance_date);


--
-- Name: idx_att_operator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_att_operator ON public.attendance_records USING btree (operator_id);


--
-- Name: idx_att_shift; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_att_shift ON public.attendance_records USING btree (shift_id);


--
-- Name: idx_att_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_att_status ON public.attendance_records USING btree (status);


--
-- Name: idx_bl_bulletin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bl_bulletin_id ON public.bulletin_lines USING btree (bulletin_id);


--
-- Name: idx_bl_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bl_sequence ON public.bulletin_lines USING btree (bulletin_id, sequence);


--
-- Name: idx_bs_style_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bs_style_id ON public.bulletin_styles USING btree (style_id);


--
-- Name: idx_bso_station_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bso_station_id ON public.balance_station_operations USING btree (balance_workstation_id);


--
-- Name: idx_bulletins_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_status ON public.operation_bulletins USING btree (status);


--
-- Name: idx_bw_design_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bw_design_id ON public.balance_workstations USING btree (line_design_id);


--
-- Name: idx_capacity_plans_bulletin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capacity_plans_bulletin_id ON public.capacity_plans USING btree (bulletin_id);


--
-- Name: idx_capacity_plans_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_capacity_plans_order_id ON public.capacity_plans USING btree (order_id);


--
-- Name: idx_chat_conv_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_conv_updated ON public.chat_conversations USING btree (updated_at DESC);


--
-- Name: idx_chat_conv_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_conv_user ON public.chat_conversations USING btree (user_identifier);


--
-- Name: idx_chat_feedback_msg; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_feedback_msg ON public.chat_feedback USING btree (message_id);


--
-- Name: idx_chat_msg_conv; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_msg_conv ON public.chat_messages USING btree (conversation_id);


--
-- Name: idx_chat_msg_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_msg_created ON public.chat_messages USING btree (created_at);


--
-- Name: idx_hpe_line_plan_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpe_line_plan_date ON public.hourly_production_entries USING btree (line_plan_id, log_date);


--
-- Name: idx_hpe_operation_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpe_operation_date ON public.hourly_production_entries USING btree (operation_id, log_date);


--
-- Name: idx_hpe_operator_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hpe_operator_date ON public.hourly_production_entries USING btree (operator_id, log_date);


--
-- Name: idx_ldm_design_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ldm_design_id ON public.line_design_machines USING btree (line_design_id);


--
-- Name: idx_line_designs_line_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_line_designs_line_id ON public.line_designs USING btree (line_id);


--
-- Name: idx_line_designs_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_line_designs_order_id ON public.line_designs USING btree (order_id);


--
-- Name: idx_line_designs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_line_designs_status ON public.line_designs USING btree (status);


--
-- Name: idx_line_plan_assignment_plan_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_line_plan_assignment_plan_id ON public.line_plan_assignments USING btree (line_plan_id);


--
-- Name: idx_line_plan_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_line_plan_order_id ON public.line_plans USING btree (order_id);


--
-- Name: idx_machines_line; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_machines_line ON public.machines USING btree (line_id);


--
-- Name: idx_machines_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_machines_status ON public.machines USING btree (status);


--
-- Name: idx_machines_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_machines_type ON public.machines USING btree (machine_type);


--
-- Name: idx_notif_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notif_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notif_operator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_operator_id ON public.notifications USING btree (operator_id);


--
-- Name: idx_notif_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_type ON public.notifications USING btree (type);


--
-- Name: idx_op_affinities_alt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_op_affinities_alt ON public.operation_affinities USING btree (alternative_operation_id);


--
-- Name: idx_op_affinities_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_op_affinities_primary ON public.operation_affinities USING btree (primary_operation_id);


--
-- Name: idx_operations_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operations_active ON public.operations USING btree (active);


--
-- Name: idx_operations_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operations_sequence ON public.operations USING btree (sequence);


--
-- Name: idx_operators_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operators_active ON public.operators USING btree (active);


--
-- Name: idx_operators_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operators_department ON public.operators USING btree (department);


--
-- Name: idx_operators_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operators_name ON public.operators USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- Name: idx_opt_rec_design_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opt_rec_design_id ON public.optimization_recommendations USING btree (line_design_id);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_style; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_style ON public.orders USING btree (style_id);


--
-- Name: idx_osl_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_osl_order_id ON public.order_size_lines USING btree (order_id);


--
-- Name: idx_osp_design_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_osp_design_id ON public.operator_station_placements USING btree (line_design_id);


--
-- Name: idx_osp_operator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_osp_operator_id ON public.operator_station_placements USING btree (operator_id);


--
-- Name: idx_perf_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_perf_logs_date ON public.operator_performance_logs USING btree (log_date);


--
-- Name: idx_perf_logs_operation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_perf_logs_operation ON public.operator_performance_logs USING btree (operation_id);


--
-- Name: idx_perf_logs_operator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_perf_logs_operator ON public.operator_performance_logs USING btree (operator_id);


--
-- Name: idx_ppl_hour_slot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ppl_hour_slot ON public.piece_production_logs USING btree (hour_slot);


--
-- Name: idx_ppl_log_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ppl_log_date ON public.piece_production_logs USING btree (log_date);


--
-- Name: idx_ppl_operator_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ppl_operator_date ON public.piece_production_logs USING btree (operator_id, log_date);


--
-- Name: idx_sa_operator_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sa_operator_active ON public.shift_assignments USING btree (operator_id, effective_to) WHERE (effective_to IS NULL);


--
-- Name: idx_sa_operator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sa_operator_id ON public.shift_assignments USING btree (operator_id);


--
-- Name: idx_sa_shift_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sa_shift_id ON public.shift_assignments USING btree (shift_id);


--
-- Name: idx_sa_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sa_status ON public.shift_assignments USING btree (status);


--
-- Name: idx_sewing_lines_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sewing_lines_active ON public.sewing_lines USING btree (active);


--
-- Name: idx_shifts_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_active ON public.shifts USING btree (active);


--
-- Name: idx_sizes_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sizes_active ON public.sizes USING btree (active);


--
-- Name: idx_sizes_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sizes_sequence ON public.sizes USING btree (sequence);


--
-- Name: idx_skill_history_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_skill_history_date ON public.skill_matrix_history USING btree (updated_at);


--
-- Name: idx_skill_history_operation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_skill_history_operation ON public.skill_matrix_history USING btree (operation_id);


--
-- Name: idx_skill_history_operator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_skill_history_operator ON public.skill_matrix_history USING btree (operator_id);


--
-- Name: idx_skill_is_current; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_skill_is_current ON public.skill_assessments USING btree (is_current);


--
-- Name: idx_skill_operation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_skill_operation_id ON public.skill_assessments USING btree (operation_id);


--
-- Name: idx_skill_operator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_skill_operator_id ON public.skill_assessments USING btree (operator_id);


--
-- Name: idx_styles_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_styles_active ON public.styles USING btree (active);


--
-- Name: idx_styles_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_styles_buyer ON public.styles USING btree (buyer);


--
-- Name: uq_skill_current; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_skill_current ON public.skill_assessments USING btree (operator_id, operation_id) WHERE (is_current = true);


--
-- Name: balance_station_operations balance_station_operations_balance_workstation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_station_operations
    ADD CONSTRAINT balance_station_operations_balance_workstation_id_fkey FOREIGN KEY (balance_workstation_id) REFERENCES public.balance_workstations(id) ON DELETE CASCADE;


--
-- Name: balance_station_operations balance_station_operations_bulletin_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_station_operations
    ADD CONSTRAINT balance_station_operations_bulletin_line_id_fkey FOREIGN KEY (bulletin_line_id) REFERENCES public.bulletin_lines(id) ON DELETE SET NULL;


--
-- Name: balance_station_operations balance_station_operations_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_station_operations
    ADD CONSTRAINT balance_station_operations_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- Name: balance_workstations balance_workstations_line_design_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_workstations
    ADD CONSTRAINT balance_workstations_line_design_id_fkey FOREIGN KEY (line_design_id) REFERENCES public.line_designs(id) ON DELETE CASCADE;


--
-- Name: capacity_plans capacity_plans_bulletin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans
    ADD CONSTRAINT capacity_plans_bulletin_id_fkey FOREIGN KEY (bulletin_id) REFERENCES public.operation_bulletins(id) ON DELETE SET NULL;


--
-- Name: capacity_plans capacity_plans_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans
    ADD CONSTRAINT capacity_plans_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: capacity_plans capacity_plans_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans
    ADD CONSTRAINT capacity_plans_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE SET NULL;


--
-- Name: capacity_plans capacity_plans_style_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_plans
    ADD CONSTRAINT capacity_plans_style_id_fkey FOREIGN KEY (style_id) REFERENCES public.styles(id) ON DELETE SET NULL;


--
-- Name: chat_feedback chat_feedback_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_feedback
    ADD CONSTRAINT chat_feedback_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: line_plan_assignments fk_assignment_bulletin_line; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plan_assignments
    ADD CONSTRAINT fk_assignment_bulletin_line FOREIGN KEY (bulletin_line_id) REFERENCES public.bulletin_lines(id);


--
-- Name: line_plan_assignments fk_assignment_operation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plan_assignments
    ADD CONSTRAINT fk_assignment_operation FOREIGN KEY (operation_id) REFERENCES public.operations(id);


--
-- Name: line_plan_assignments fk_assignment_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plan_assignments
    ADD CONSTRAINT fk_assignment_operator FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: line_plan_assignments fk_assignment_plan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plan_assignments
    ADD CONSTRAINT fk_assignment_plan FOREIGN KEY (line_plan_id) REFERENCES public.line_plans(id) ON DELETE CASCADE;


--
-- Name: attendance_records fk_att_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT fk_att_operator FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: attendance_records fk_att_shift; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT fk_att_shift FOREIGN KEY (shift_id) REFERENCES public.shifts(id);


--
-- Name: bulletin_lines fk_bl_bulletin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_lines
    ADD CONSTRAINT fk_bl_bulletin FOREIGN KEY (bulletin_id) REFERENCES public.operation_bulletins(id) ON DELETE CASCADE;


--
-- Name: bulletin_lines fk_bl_operation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_lines
    ADD CONSTRAINT fk_bl_operation FOREIGN KEY (operation_id) REFERENCES public.operations(id);


--
-- Name: bulletin_styles fk_bs_bulletin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_styles
    ADD CONSTRAINT fk_bs_bulletin FOREIGN KEY (bulletin_id) REFERENCES public.operation_bulletins(id) ON DELETE CASCADE;


--
-- Name: bulletin_styles fk_bs_style; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletin_styles
    ADD CONSTRAINT fk_bs_style FOREIGN KEY (style_id) REFERENCES public.styles(id);


--
-- Name: hourly_production_entries fk_hpe_line_plan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_production_entries
    ADD CONSTRAINT fk_hpe_line_plan FOREIGN KEY (line_plan_id) REFERENCES public.line_plans(id) ON DELETE CASCADE;


--
-- Name: hourly_production_entries fk_hpe_operation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_production_entries
    ADD CONSTRAINT fk_hpe_operation FOREIGN KEY (operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- Name: hourly_production_entries fk_hpe_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hourly_production_entries
    ADD CONSTRAINT fk_hpe_operator FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE CASCADE;


--
-- Name: line_plans fk_line_plan_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plans
    ADD CONSTRAINT fk_line_plan_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: line_plans fk_line_plan_shift; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plans
    ADD CONSTRAINT fk_line_plan_shift FOREIGN KEY (shift_id) REFERENCES public.shifts(id);


--
-- Name: machines fk_machines_line; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT fk_machines_line FOREIGN KEY (line_id) REFERENCES public.sewing_lines(id) ON DELETE SET NULL;


--
-- Name: orders fk_orders_style; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_style FOREIGN KEY (style_id) REFERENCES public.styles(id);


--
-- Name: order_size_lines fk_osl_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_size_lines
    ADD CONSTRAINT fk_osl_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_size_lines fk_osl_size; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_size_lines
    ADD CONSTRAINT fk_osl_size FOREIGN KEY (size_id) REFERENCES public.sizes(id);


--
-- Name: piece_production_logs fk_ppl_operation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piece_production_logs
    ADD CONSTRAINT fk_ppl_operation FOREIGN KEY (operation_id) REFERENCES public.operations(id) ON DELETE SET NULL;


--
-- Name: piece_production_logs fk_ppl_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piece_production_logs
    ADD CONSTRAINT fk_ppl_operator FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE CASCADE;


--
-- Name: piece_production_logs fk_ppl_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piece_production_logs
    ADD CONSTRAINT fk_ppl_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: shift_assignments fk_sa_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT fk_sa_operator FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: shift_assignments fk_sa_shift; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT fk_sa_shift FOREIGN KEY (shift_id) REFERENCES public.shifts(id);


--
-- Name: skill_assessments fk_skill_operation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_assessments
    ADD CONSTRAINT fk_skill_operation FOREIGN KEY (operation_id) REFERENCES public.operations(id);


--
-- Name: skill_assessments fk_skill_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_assessments
    ADD CONSTRAINT fk_skill_operator FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: line_design_machines line_design_machines_line_design_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_design_machines
    ADD CONSTRAINT line_design_machines_line_design_id_fkey FOREIGN KEY (line_design_id) REFERENCES public.line_designs(id) ON DELETE CASCADE;


--
-- Name: line_designs line_designs_bulletin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_bulletin_id_fkey FOREIGN KEY (bulletin_id) REFERENCES public.operation_bulletins(id) ON DELETE SET NULL;


--
-- Name: line_designs line_designs_capacity_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_capacity_plan_id_fkey FOREIGN KEY (capacity_plan_id) REFERENCES public.capacity_plans(id) ON DELETE SET NULL;


--
-- Name: line_designs line_designs_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.sewing_lines(id) ON DELETE SET NULL;


--
-- Name: line_designs line_designs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: line_designs line_designs_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_designs
    ADD CONSTRAINT line_designs_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE SET NULL;


--
-- Name: line_plans line_plans_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_plans
    ADD CONSTRAINT line_plans_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.sewing_lines(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE SET NULL;


--
-- Name: operation_affinities operation_affinities_alternative_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_affinities
    ADD CONSTRAINT operation_affinities_alternative_operation_id_fkey FOREIGN KEY (alternative_operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- Name: operation_affinities operation_affinities_primary_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_affinities
    ADD CONSTRAINT operation_affinities_primary_operation_id_fkey FOREIGN KEY (primary_operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- Name: operation_bulletins operation_bulletins_parent_bulletin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation_bulletins
    ADD CONSTRAINT operation_bulletins_parent_bulletin_id_fkey FOREIGN KEY (parent_bulletin_id) REFERENCES public.operation_bulletins(id) ON DELETE SET NULL;


--
-- Name: operator_attachments operator_attachments_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_attachments
    ADD CONSTRAINT operator_attachments_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: operator_performance_logs operator_performance_logs_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_performance_logs
    ADD CONSTRAINT operator_performance_logs_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.operations(id);


--
-- Name: operator_performance_logs operator_performance_logs_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_performance_logs
    ADD CONSTRAINT operator_performance_logs_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: operator_station_placements operator_station_placements_balance_workstation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_station_placements
    ADD CONSTRAINT operator_station_placements_balance_workstation_id_fkey FOREIGN KEY (balance_workstation_id) REFERENCES public.balance_workstations(id) ON DELETE CASCADE;


--
-- Name: operator_station_placements operator_station_placements_line_design_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_station_placements
    ADD CONSTRAINT operator_station_placements_line_design_id_fkey FOREIGN KEY (line_design_id) REFERENCES public.line_designs(id) ON DELETE CASCADE;


--
-- Name: operator_station_placements operator_station_placements_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_station_placements
    ADD CONSTRAINT operator_station_placements_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE SET NULL;


--
-- Name: optimization_recommendations optimization_recommendations_balance_workstation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimization_recommendations
    ADD CONSTRAINT optimization_recommendations_balance_workstation_id_fkey FOREIGN KEY (balance_workstation_id) REFERENCES public.balance_workstations(id) ON DELETE CASCADE;


--
-- Name: optimization_recommendations optimization_recommendations_line_design_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimization_recommendations
    ADD CONSTRAINT optimization_recommendations_line_design_id_fkey FOREIGN KEY (line_design_id) REFERENCES public.line_designs(id) ON DELETE CASCADE;


--
-- Name: skill_matrix_history skill_matrix_history_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_matrix_history
    ADD CONSTRAINT skill_matrix_history_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.operations(id);


--
-- Name: skill_matrix_history skill_matrix_history_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_matrix_history
    ADD CONSTRAINT skill_matrix_history_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Yig3noEUzlXSsZIpqxJ3CZeqhoxWpzvfLvGCwzMEJccYCEy2guXUDxWzGz4kW5u

