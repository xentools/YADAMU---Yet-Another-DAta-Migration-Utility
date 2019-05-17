--
declare
/*
**
** "Duck Type" support for JSON Operations
**
** Check for TREAT AS JSON Support (18.1)
** Check for CLOB support (18.1 and Patches)
** Check for VARCHAR2(32K) support.
**
** Create a package that can be used with PL/SQL conditional compliation
*/

  C_NEWLINE CONSTANT CHAR(1) := CHR(10);

  CLOB_UNSUPPORTED EXCEPTION;
  PRAGMA EXCEPTION_INIT( CLOB_UNSUPPORTED , -40449);

  EXTENDED_STRING_UNSUPPORTED EXCEPTION;
  PRAGMA EXCEPTION_INIT( EXTENDED_STRING_UNSUPPORTED , -1489);

  TREAT_AS_JSON_UNSUPPORTED EXCEPTION;
  PRAGMA EXCEPTION_INIT( TREAT_AS_JSON_UNSUPPORTED , -902);

  V_PACKAGE_DEFINITION VARCHAR2(32767);
  
  V_DUMMY NUMBER;
begin
  V_PACKAGE_DEFINITION := 'CREATE OR REPLACE PACKAGE JSON_FEATURE_DETECTION AS' || C_NEWLINE;

  begin
    execute immediate 'select JSON_ARRAY(DUMMY returning CLOB) from DUAL';
    V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
	                     ||  '  CLOB_SUPPORTED         CONSTANT BOOLEAN      := TRUE;' || CHR(13) 
                         ||  '  C_RETURN_TYPE          CONSTANT VARCHAR2(32) := ''CLOB'';' || CHR(13)
                         ||  '  C_MAX_STRING_SIZE      CONSTANT NUMBER       := DBMS_LOB.LOBMAXSIZE;';
  exception
    WHEN CLOB_UNSUPPORTED THEN
	  V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
	                       || '  CLOB_SUPPORTED          CONSTANT BOOLEAN      := FALSE;';
    WHEN OTHERS THEN
	  RAISE;
  end;

  begin
    select length('X' || RPAD('X',4001)) into V_DUMMY from dual;
    V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
	                     || '  EXTENDED_STRING_SUPPORTED CONSTANT BOOLEAN      := TRUE;' || CHR(13) 
                         || '  C_RETURN_TYPE             CONSTANT VARCHAR2(32) := ''VARCHAR2(32767)'';' || CHR(13)
                         || '  C_MAX_STRING_SIZE         CONSTANT NUMBER       := 32767;';
  exception
    WHEN EXTENDED_STRING_UNSUPPORTED THEN
	  V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
	                       || '  EXTENDED_STRING_SUPPORTED CONSTANT BOOLEAN      := FALSE;' || CHR(13) 
                           || '  C_RETURN_TYPE             CONSTANT VARCHAR2(32) := ''VARCHAR2(4000)'';' || CHR(13)
                           || '  C_MAX_STRING_SIZE         CONSTANT NUMBER       := 4000;';
    WHEN OTHERS THEN
	  RAISE;
  end;

  begin
  
    execute immediate 'select TREAT(DUMMY AS JSON) from DUAL';
    V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
	                     || '  TREAT_AS_JSON_SUPPORTED CONSTANT BOOLEAN := TRUE;';
  exception
    WHEN TREAT_AS_JSON_UNSUPPORTED THEN
	  V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
	                       || '  TREAT_AS_JSON_SUPPORTED CONSTANT BOOLEAN := FALSE;';
    WHEN OTHERS THEN
	  RAISE;
  end;

  V_PACKAGE_DEFINITION := V_PACKAGE_DEFINITION
                       || 'END;';
                       
  execute immediate V_PACKAGE_DEFINITION;
end;
/
--