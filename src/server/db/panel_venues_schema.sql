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
-- Name: panel_venues; Type: TABLE; Schema: public; Owner: davidoxtoby
--

CREATE TABLE public.panel_venues (
    id bigint NOT NULL,
    active boolean,
    code character varying(50),
    name character varying(100),
    add1 character varying(100),
    add2 character varying(100),
    add3 character varying(100),
    postcode character varying(20),
    tel character varying(20),
    venue_url character varying(200),
    default_adviser_count integer,
    default_candidate_count integer,
    include boolean,
    create_date timestamp without time zone,
    created_by integer,
    status character(1)
);


ALTER TABLE public.panel_venues OWNER TO davidoxtoby;

--
-- Name: panel_venues panel_venues_pkey; Type: CONSTRAINT; Schema: public; Owner: davidoxtoby
--

ALTER TABLE ONLY public.panel_venues
    ADD CONSTRAINT panel_venues_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

