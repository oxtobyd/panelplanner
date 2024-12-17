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
-- Name: panel_secretaries; Type: TABLE; Schema: public; Owner: davidoxtoby
--

CREATE TABLE public.panel_secretaries (
    id bigint NOT NULL,
    user_id integer,
    active boolean,
    initials character varying(10),
    name character varying(100),
    tel character varying(20),
    email character varying(100),
    forenames character varying(100),
    surname character varying(100)
);


ALTER TABLE public.panel_secretaries OWNER TO davidoxtoby;

--
-- Name: panel_secretaries panel_secretaries_pkey; Type: CONSTRAINT; Schema: public; Owner: davidoxtoby
--

ALTER TABLE ONLY public.panel_secretaries
    ADD CONSTRAINT panel_secretaries_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

