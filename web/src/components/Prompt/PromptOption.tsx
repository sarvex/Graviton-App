import { useEffect, useRef } from "react";
import styled from "styled-components";
import { PromptOptionArgs } from "./Prompt.types";

const StyledPromptOption = styled.button<{ isSelected: boolean }>`
  color: white;
  margin-bottom: 3px;
  padding: 8px 10px;
  border-radius: 7px;
  width: 100%;
  border: none;
  text-align: left;
  font-size: 13px;
  outline: none;
  background: ${({ isSelected, theme }) =>
  isSelected
    ? theme.elements.prompt.option.selected.background
    : theme.elements.prompt.option.background};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.elements.prompt.option.hover.background};
  }
`;

export function PromptOption(
  { option, closePrompt, selectedOption, indexOption, text }: PromptOptionArgs,
) {
  const optionRef = useRef(null);

  function optionSelected() {
    option.onSelected({
      closePrompt,
    });
  }

  const isSelected = selectedOption === indexOption;

  useEffect(() => {
    if (isSelected && optionRef.current) {
      const element = optionRef.current as HTMLElement;
      element.focus();
    }
  }, [isSelected]);

  return (
    <StyledPromptOption
      ref={optionRef}
      key={option.label.text}
      onClick={optionSelected}
      isSelected={isSelected}
    >
      {text}
    </StyledPromptOption>
  );
}
