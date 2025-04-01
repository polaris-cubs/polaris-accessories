--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Debian 15.12-1.pgdg120+1)
-- Dumped by pg_dump version 15.12 (Debian 15.12-1.pgdg120+1)

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
-- Name: dim_customer; Type: TABLE; Schema: public; Owner: polaris_user
--

CREATE TABLE public.dim_customer (
    customer_id bigint NOT NULL,
    state text NOT NULL
);


ALTER TABLE public.dim_customer OWNER TO polaris_user;

--
-- Name: dim_property; Type: TABLE; Schema: public; Owner: polaris_user
--

CREATE TABLE public.dim_property (
    property_id integer NOT NULL,
    property_name text NOT NULL,
    property_units text NOT NULL
);


ALTER TABLE public.dim_property OWNER TO polaris_user;

--
-- Name: dim_vehicle; Type: TABLE; Schema: public; Owner: polaris_user
--

CREATE TABLE public.dim_vehicle (
    vehicle_id text NOT NULL,
    brand text NOT NULL
);


ALTER TABLE public.dim_vehicle OWNER TO polaris_user;

--
-- Name: fact_ride_property; Type: TABLE; Schema: public; Owner: polaris_user
--

CREATE TABLE public.fact_ride_property (
    ride_property_id integer NOT NULL,
    ride_id bigint NOT NULL,
    property_id integer NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.fact_ride_property OWNER TO polaris_user;

--
-- Name: fact_ride_property_ride_property_id_seq; Type: SEQUENCE; Schema: public; Owner: polaris_user
--

CREATE SEQUENCE public.fact_ride_property_ride_property_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fact_ride_property_ride_property_id_seq OWNER TO polaris_user;

--
-- Name: fact_ride_property_ride_property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: polaris_user
--

ALTER SEQUENCE public.fact_ride_property_ride_property_id_seq OWNED BY public.fact_ride_property.ride_property_id;


--
-- Name: fact_vehicle_ride; Type: TABLE; Schema: public; Owner: polaris_user
--

CREATE TABLE public.fact_vehicle_ride (
    ride_id bigint NOT NULL,
    customer_id bigint NOT NULL,
    vehicle_id text NOT NULL,
    event_timestamp timestamp without time zone NOT NULL
);


ALTER TABLE public.fact_vehicle_ride OWNER TO polaris_user;

--
-- Name: fact_ride_property ride_property_id; Type: DEFAULT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_ride_property ALTER COLUMN ride_property_id SET DEFAULT nextval('public.fact_ride_property_ride_property_id_seq'::regclass);


--
-- Name: dim_customer dim_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.dim_customer
    ADD CONSTRAINT dim_customer_pkey PRIMARY KEY (customer_id);


--
-- Name: dim_property dim_property_pkey; Type: CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.dim_property
    ADD CONSTRAINT dim_property_pkey PRIMARY KEY (property_id);


--
-- Name: dim_vehicle dim_vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.dim_vehicle
    ADD CONSTRAINT dim_vehicle_pkey PRIMARY KEY (vehicle_id);


--
-- Name: fact_ride_property fact_ride_property_pkey; Type: CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_ride_property
    ADD CONSTRAINT fact_ride_property_pkey PRIMARY KEY (ride_property_id);


--
-- Name: fact_vehicle_ride fact_vehicle_ride_pkey; Type: CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_vehicle_ride
    ADD CONSTRAINT fact_vehicle_ride_pkey PRIMARY KEY (ride_id);


--
-- Name: fact_ride_property fact_ride_property_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_ride_property
    ADD CONSTRAINT fact_ride_property_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.dim_property(property_id);


--
-- Name: fact_ride_property fact_ride_property_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_ride_property
    ADD CONSTRAINT fact_ride_property_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.fact_vehicle_ride(ride_id);


--
-- Name: fact_vehicle_ride fact_vehicle_ride_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_vehicle_ride
    ADD CONSTRAINT fact_vehicle_ride_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.dim_customer(customer_id);


--
-- Name: fact_vehicle_ride fact_vehicle_ride_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: polaris_user
--

ALTER TABLE ONLY public.fact_vehicle_ride
    ADD CONSTRAINT fact_vehicle_ride_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.dim_vehicle(vehicle_id);


--
-- PostgreSQL database dump complete
--

