set echo on 
spool logs/COMPARE_ALL_SCHEMAS.log
--
def SCHEMA = HR
--
@@COMPARE_SCHEMAS &SCHEMA &SCHEMA.1
--
def SCHEMA = SH
--
@@COMPARE_SCHEMAS &SCHEMA &SCHEMA.1
--
def SCHEMA = OE
--
@@COMPARE_SCHEMAS &SCHEMA &SCHEMA.1
--
def SCHEMA = PM
--
@@COMPARE_SCHEMAS &SCHEMA &SCHEMA.1
--
def SCHEMA = IX
--
@@COMPARE_SCHEMAS &SCHEMA &SCHEMA.1
--
def SCHEMA = BI
--
@@COMPARE_SCHEMAS &SCHEMA &SCHEMA.1
--
quit

