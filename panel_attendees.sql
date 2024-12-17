--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8 (Homebrew)
-- Dumped by pg_dump version 15.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: panel_attendees; Type: TABLE; Schema: public; Owner: davidoxtoby
--

CREATE TABLE public.panel_attendees (
    id bigint NOT NULL,
    created_date timestamp without time zone,
    created_by integer,
    panel_id bigint,
    attendee_id bigint,
    attendee_type character(1),
    attendee_diocese_id bigint,
    attendee_gender character(1),
    attendee_team character varying(50),
    season character varying(10),
    last_updated_date timestamp without time zone,
    batch_id character varying(50),
    attendance_request_id character varying(50),
    mfa_or_pfa character varying(10),
    mp1_or_2 character varying(10)
);


ALTER TABLE public.panel_attendees OWNER TO davidoxtoby;

--
-- Name: panel_attendees panel_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: davidoxtoby
--

ALTER TABLE ONLY public.panel_attendees
    ADD CONSTRAINT panel_attendees_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

