<?php
/*!Copyright netrox(sc) http://www.netroxsc.ru
 * SCLOG interpreter
 *
 * version 1.1
 * 2011-08-23
 *
 * License: Creative Commons Share Alike
 * http://creativecommons.org/licenses/by-sa/2.5/
 *
 * Run parse_expression($expression, $variables) with SCLOG-programm & variables array as arguments 
 */

function i_atom($action, $parameter, $value){
	switch ($action){
		case '=';
			return $parameter==$value;
			break;
		case '!=';
			return $parameter!=$value;
			break;
		case '~';			
			return (substr_count($parameter,$value)>0);
			break;
		case '!~';
			return (substr_count($parameter,$value)==0);
			break;
		case '>';
			return $parameter>$value;
			break;
		case '>=';
			return $parameter>=$value;
			break;
		case '<';
			return $parameter<$value;
			break;
		case '<=';
			return $parameter<=$value;
			break;
		default:
			return false;
			break;			
	};
}

function parse_atom($atom, $variables){
	//echo "A: ".$atom."\n";
	$action=trim(substr($atom,0,strpos($atom, "(")));
	$parameter=trim(substr($atom,strpos($atom, "(")+1,strpos($atom, ",")-strpos($atom, "(")-1));
	$value=trim(substr($atom,strpos($atom, ",")+1,strpos($atom, ")")-strpos($atom, ",")-1));
	if ($value[0]=='"'){
		$value=trim(substr($value,1,strlen($value)-2));
	};

	if (isset($variables[$parameter])){
		//echo "OK   => ".i_atom($action,mb_strtolower($variables[$parameter]),mb_strtolower($value))."\n";
		//echo "        =>".mb_strtolower($variables[$parameter])."\n";
		//echo "        =>".mb_strtolower($value)."\n";
		return i_atom($action,mb_strtolower($variables[$parameter]),mb_strtolower($value));
	} else {
		//echo "NULL => ".$value."\n";
		return i_atom($action,null,$value);
	};
}

function subexpression($expression){
	$result=substr($expression,0,strpos($expression,'(')+1);
	$expression=substr($expression,strpos($expression,'(')+1);
	$z=1;
	for ($i=0; $i<strlen($expression);$i++){
		$chr=$expression[$i];
		if ($chr=='('){
			$z++;
		} else if ($chr==')'){
			$z--;
		};
		$result.=$chr;
		if ($z==0){
			break;
		};
	};
	//echo "S: ".$result."\n";
	return $result;
}

function parse_expression($expression, $variables){
	$expression=trim($expression);
	//echo "E: ".$expression."\n";
	if ($expression[0]=='&'){
		$result=true;
		$expression=trim(substr($expression,2,strlen($expression)-3));
		while ($result && strlen($expression)>0){
			if ($expression[0]=='|' || $expression[0]=='&'){
				$subexpression=subexpression($expression);
				$result&=parse_expression($subexpression, $variables);
				$expression=trim(substr($expression, strlen($subexpression)+1));
			} else {
				$atom=substr($expression,0,strpos($expression,")")+1);
				$expression=trim(substr($expression,strlen($atom)+1));
				$result&=parse_atom($atom,$variables);
			};
			if (strlen($expression) && $expression[0]==','){
				//echo "C: ".$expression."\n";
				$expression=trim(substr($expression,1));
				//echo "D: ".$expression."\n";
			};
		};
		return $result;
	} else if ($expression[0]=='|'){
		$result=false;
		$expression=trim(substr($expression,2,strlen($expression)-3));
		while (!$result && strlen($expression)>0){
			if ($expression[0]=='|' || $expression[0]=='&'){
				$subexpression=subexpression($expression);
				$result|=parse_expression($subexpression,$variables);
				$expression=trim(substr($expression, strlen($subexpression)+1));
			} else {
				$atom=substr($expression,0,strpos($expression,")")+1);
				$expression=trim(substr($expression,strlen($atom)+1));
				$result|=parse_atom($atom, $variables);
			};
			if (strlen($expression) && $expression[0]==','){
				$expression=trim(substr($expression,1));
			};
		};
		return $result;
	} else {
		return parse_atom($expression,$variables);
		//echo "\n".$expression."\n";
	};
}