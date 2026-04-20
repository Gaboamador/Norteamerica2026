import { createContext, useContext, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    resolve: null,
  });

  const confirm = ({ title, message }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    state.resolve(true);
    setState({ ...state, open: false });
  };

  const handleCancel = () => {
    state.resolve(false);
    setState({ ...state, open: false });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <ConfirmModal
        open={state.open}
        title={state.title}
        message={state.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);